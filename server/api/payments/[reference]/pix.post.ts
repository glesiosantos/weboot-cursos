import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'
import { loadMercadoPagoProvider, loadPaymentContext, mercadoPagoPayer } from '../../../utils/payment'
import { paymentPrice } from '../../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') { return { paid: true } }
  if (context.order.provider_payment_id) {
    if (context.order.payment_provider !== 'MERCADO_PAGO') { throw createError({ statusCode: 409, statusMessage: 'Este pedido pertence a outro provedor de pagamento.' }) }
    const payment = await loadMercadoPagoProvider(event).getPayment(context.order.provider_payment_id)
    return { payment_id: payment.id, encodedImage: payment.qrCodeBase64, payload: payment.payload, expirationDate: payment.expirationDate }
  }
  enforceRegistrationRateLimit(event, 5, 10 * 60_000)
  const config = useRuntimeConfig(event)
  if (!context.order.expires_at) { throw createError({ statusCode: 409, statusMessage: 'Pedido sem prazo de pagamento' }) }
  const price = paymentPrice(Number(context.order.unit_price), 'PIX', 1, config)
  const provider = loadMercadoPagoProvider(event)
  const payment = await provider.createPixPayment({
    idempotencyKey: context.order.id,
    amount: price.total,
    expirationDate: context.order.expires_at,
    description: `Inscrição - ${context.order.courses?.title ?? 'Curso'}`.slice(0, 150),
    externalReference: context.order.id,
    notificationUrl: String(config.mercadoPagoWebhookUrl || '') || undefined,
    payer: mercadoPagoPayer(context, String(config.registrationDataKey || '')),
  })
  const { error } = await context.admin.from('orders').update({
    total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'PIX', installment_count: 1, payment_provider: 'MERCADO_PAGO', provider_payment_id: payment.id,
  }).eq('id', context.order.id).is('provider_payment_id', null)
  if (error) { throw error }
  return { payment_id: payment.id, encodedImage: payment.qrCodeBase64, payload: payment.payload, expirationDate: payment.expirationDate }
})
