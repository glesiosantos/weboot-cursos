import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'
import { loadMercadoPagoProvider, loadPaymentContext, mercadoPagoPayer } from '../../../utils/payment'
import { paymentPrice } from '../../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  enforceRegistrationRateLimit(event, 5, 10 * 60_000)
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') { return { paid: true } }
  if (context.order.payment_method === 'PIX' && context.order.provider_payment_id) {
    throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui um Pix aberto.' })
  }
  if (context.order.provider_payment_id || context.order.asaas_payment_id) {
    throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui uma cobrança. Inicie uma nova inscrição para trocar a forma de pagamento.' })
  }
  const config = useRuntimeConfig(event)
  const price = paymentPrice(Number(context.order.unit_price), 'CREDIT_CARD', 1, config)
  const appUrl = String(config.public.appUrl).replace(/\/$/, '')
  const returnUrl = `${appUrl}/pagamento/${encodeURIComponent(context.reference)}?checkout=return`
  const provider = loadMercadoPagoProvider(event)
  if (context.order.provider_preference_id) {
    const preference = await provider.getPreference(String(context.order.provider_preference_id))
    if (preference.init_point) { return { init_point: preference.init_point } }
  }
  const preference = await provider.createCardPreference({
    amount: price.total,
    title: `Inscrição - ${context.order.courses?.title ?? 'Curso'}`.slice(0, 150),
    externalReference: context.order.id,
    notificationUrl: String(config.mercadoPagoWebhookUrl || '') || undefined,
    successUrl: returnUrl,
    failureUrl: returnUrl,
    pendingUrl: returnUrl,
    payer: mercadoPagoPayer(context, String(config.registrationDataKey || '')),
  })
  const { data, error } = await context.admin.from('orders').update({
    total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'CREDIT_CARD', installment_count: 1,
    payment_provider: 'MERCADO_PAGO', provider_preference_id: preference.id,
  }).eq('id', context.order.id).is('provider_payment_id', null).is('provider_preference_id', null).select('id').maybeSingle()
  if (error) { throw error }
  if (!data) {
    const { data: saved } = await context.admin.from('orders').select('provider_preference_id').eq('id', context.order.id).single()
    if (saved?.provider_preference_id !== preference.id) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe uma tentativa de pagamento para este pedido.' })
    }
  }
  return { init_point: preference.initPoint }
})
