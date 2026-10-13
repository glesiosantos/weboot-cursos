import { completeCommercialOrder } from '../../../services/complete-order.service'
import { MercadoPagoPaymentProvider } from '../../../services/mercado-pago-payment.provider'
import { loadPaymentContext } from '../../../utils/payment'

const confirmedStatuses = new Set(['approved'])

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') {
    return { status: context.order.status }
  }
  if (context.order.status !== 'WAITING_PAYMENT') {
    return { status: context.order.status }
  }
  if (context.order.payment_provider !== 'MERCADO_PAGO') { return { status: context.order.status } }
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Pagamento não configurado' }) }
  const provider = new MercadoPagoPaymentProvider(String(config.mercadoPagoAccessToken))
  let paymentId = String(context.order.provider_payment_id || '')
  if (!paymentId && context.order.payment_method === 'CREDIT_CARD' && context.order.provider_preference_id) {
    const candidates = await provider.searchPayments(context.order.id)
    const payment = candidates.find(candidate => candidate.paymentTypeId === 'credit_card' && candidate.externalReference === context.order.id
      && candidate.value !== undefined && Math.round(Number(candidate.value) * 100) === Math.round(Number(context.order.total) * 100))
    if (!payment) { return { status: context.order.status } }
    const { data: linked, error } = await context.admin.from('orders').update({
      provider_payment_id: payment.id, installment_count: payment.installments ?? 1,
    }).eq('id', context.order.id).is('provider_payment_id', null).eq('provider_preference_id', context.order.provider_preference_id).select('id').maybeSingle()
    if (error) { throw error }
    if (!linked) { return { status: context.order.status } }
    paymentId = payment.id
  }
  if (!paymentId) { return { status: context.order.status } }
  const payment = await provider.getPayment(paymentId)

  if (payment.externalReference !== context.order.id || payment.id !== paymentId) {
    throw createError({ statusCode: 409, statusMessage: 'Pagamento não pertence ao pedido' })
  }
  if (context.order.payment_method === 'CREDIT_CARD' && payment.paymentTypeId !== 'credit_card') {
    throw createError({ statusCode: 409, statusMessage: 'O pagamento consultado não é de cartão de crédito' })
  }
  if (payment.value === undefined || Math.round(Number(payment.value) * 100) !== Math.round(Number(context.order.total) * 100)) {
    throw createError({ statusCode: 409, statusMessage: 'Valor recebido diverge do pedido' })
  }
  if (!confirmedStatuses.has(payment.status)) {
    if (['refunded', 'charged_back'].includes(payment.status)) {
      await context.admin.rpc('cancel_commercial_order', { target_order_id: context.order.id, new_status: 'REFUNDED' }).throwOnError()
      return { status: 'REFUNDED', provider_status: payment.status }
    }
    if (['cancelled', 'rejected'].includes(payment.status)) {
      await context.admin.rpc('cancel_commercial_order', { target_order_id: context.order.id, new_status: 'CANCELED' }).throwOnError()
      return { status: 'CANCELED', provider_status: payment.status }
    }
    return { status: context.order.status, provider_status: payment.status }
  }

  await completeCommercialOrder(context.admin, context.order.id, payment.id, payment.status, {
    url: String(config.notificationWebhookUrl || ''),
    token: String(config.notificationWebhookToken || ''),
    appUrl: String(config.public.appUrl),
    smtp: {
      host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure),
      user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || ''),
    },
  })
  return { status: 'PAID' }
})
