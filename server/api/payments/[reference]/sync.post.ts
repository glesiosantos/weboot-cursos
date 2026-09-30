import { completeCommercialOrder } from '../../../services/complete-order.service'
import { MercadoPagoPaymentProvider } from '../../../services/mercado-pago-payment.provider'
import { loadPaymentContext } from '../../../utils/payment'

const confirmedStatuses = new Set(['approved'])

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID' || !context.order.provider_payment_id) {
    return { status: context.order.status }
  }
  if (context.order.status !== 'WAITING_PAYMENT') {
    return { status: context.order.status }
  }
  if (context.order.payment_provider !== 'MERCADO_PAGO') { return { status: context.order.status } }
  const paymentId = String(context.order.provider_payment_id)

  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Pagamento não configurado' }) }
  const provider = new MercadoPagoPaymentProvider(String(config.mercadoPagoAccessToken))
  const payment = await provider.getPayment(paymentId)

  if (payment.externalReference !== context.order.id || payment.id !== paymentId) {
    throw createError({ statusCode: 409, statusMessage: 'Pagamento não pertence ao pedido' })
  }
  if (payment.value === undefined || Math.round(Number(payment.value) * 100) !== Math.round(Number(context.order.total) * 100)) {
    throw createError({ statusCode: 409, statusMessage: 'Valor recebido diverge do pedido' })
  }
  if (!confirmedStatuses.has(payment.status)) {
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
