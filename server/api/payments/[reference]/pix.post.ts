import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'
import { ensureAsaasCustomer, loadPaymentContext } from '../../../utils/payment'
import { paymentPrice } from '../../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') { return { paid: true } }
  if (context.order.asaas_payment_id) {
    if (context.order.payment_method !== 'PIX') { throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui uma tentativa no cartão.' }) }
    const { provider } = await ensureAsaasCustomer(event, context)
    const qrCode = await provider.getPixQrCode(context.order.asaas_payment_id)
    return { payment_id: context.order.asaas_payment_id, ...qrCode }
  }
  enforceRegistrationRateLimit(event, 5, 10 * 60_000)
  const config = useRuntimeConfig(event)
  const price = paymentPrice(Number(context.order.unit_price), 'PIX', 1, config)
  const { provider, customerId } = await ensureAsaasCustomer(event, context)
  const payment = await provider.createPixPayment({
    customer: customerId, value: price.total, dueDate: new Date().toISOString().slice(0, 10),
    description: `Inscrição - ${context.order.courses?.title ?? 'Curso'}`.slice(0, 500), externalReference: context.order.id,
  })
  const { error } = await context.admin.from('orders').update({
    total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'PIX', installment_count: 1, asaas_payment_id: payment.id,
  }).eq('id', context.order.id).is('asaas_payment_id', null)
  if (error) { throw error }
  const qrCode = await provider.getPixQrCode(payment.id!)
  return { payment_id: payment.id, ...qrCode }
})
