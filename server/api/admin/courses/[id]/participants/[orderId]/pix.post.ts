import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireRole } from '../../../../../../utils/auth'
import { loadMercadoPagoProvider, mercadoPagoPayer } from '../../../../../../utils/payment'
import { paymentPrice } from '../../../../../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const orderId = z.uuid().parse(getRouterParam(event, 'orderId'))
  await requireRole(event, ['ADMIN'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: order, error } = await admin.from('orders')
    .select('*,courses(title)').eq('id', orderId).eq('course_id', courseId).single()
  if (error || !order) { throw createError({ statusCode: 404, statusMessage: 'Inscrição não encontrada' }) }
  if (!['PENDING', 'WAITING_PAYMENT'].includes(order.status)) {
    throw createError({ statusCode: 409, statusMessage: order.status === 'PAID' ? 'Este pagamento já foi confirmado' : 'Esta inscrição não aceita um novo Pix' })
  }
  if (!order.expires_at || new Date(order.expires_at).getTime() <= Date.now()) {
    throw createError({ statusCode: 410, statusMessage: 'A reserva expirou. Faça uma nova inscrição para respeitar a disponibilidade de vagas.' })
  }
  const { data: contact } = await admin.from('registration_contacts').select('*').eq('id', order.registration_id).single()
  if (!contact) { throw createError({ statusCode: 404, statusMessage: 'Participante não encontrado' }) }
  const provider = loadMercadoPagoProvider(event)
  if (order.provider_payment_id) {
    if (order.payment_provider !== 'MERCADO_PAGO') { throw createError({ statusCode: 409, statusMessage: 'Este pedido pertence a outro provedor de pagamento' }) }
    const payment = await provider.getPayment(order.provider_payment_id)
    if (payment.externalReference !== order.id || Math.abs(Number(payment.value) - Number(order.total)) > 0.009) {
      throw createError({ statusCode: 409, statusMessage: 'A cobrança retornada não corresponde a esta inscrição' })
    }
    if (!payment.encodedImage || !payment.payload) { throw createError({ statusCode: 410, statusMessage: 'O QR Code desta cobrança não está mais disponível' }) }
    return { paymentId: payment.id, encodedImage: payment.encodedImage, payload: payment.payload, expirationDate: payment.expirationDate }
  }

  const config = useRuntimeConfig(event)
  const price = paymentPrice(Number(order.unit_price), 'PIX', 1, config)
  const context = { admin, contact, order, reference: '' }
  const payment = await provider.createPixPayment({
    idempotencyKey: order.id,
    amount: price.total,
    expirationDate: order.expires_at,
    description: `Inscrição - ${order.courses?.title ?? 'Curso'}`.slice(0, 150),
    externalReference: order.id,
    notificationUrl: String(config.mercadoPagoWebhookUrl || '') || undefined,
    payer: mercadoPagoPayer(context, String(config.registrationDataKey || '')),
  })
  const { data: linkedOrder, error: linkError } = await admin.from('orders').update({
    status: 'WAITING_PAYMENT', total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'PIX', installment_count: 1, payment_provider: 'MERCADO_PAGO', provider_payment_id: payment.id,
  }).eq('id', order.id).is('provider_payment_id', null).select('id').single()
  if (linkError || !linkedOrder) { throw linkError ?? createError({ statusCode: 409, statusMessage: 'Outra cobrança já foi vinculada a esta inscrição' }) }
  return { paymentId: payment.id, encodedImage: payment.encodedImage, payload: payment.payload, expirationDate: payment.expirationDate }
})
