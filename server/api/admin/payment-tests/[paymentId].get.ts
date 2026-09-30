import { MercadoPagoPaymentProvider } from '../../../services/mercado-pago-payment.provider'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const paymentId = getRouterParam(event, 'paymentId') || ''
  if (!/^\d{5,30}$/.test(paymentId)) { throw createError({ statusCode: 404, statusMessage: 'Pagamento de teste não encontrado' }) }
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoTestAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Credenciais de teste não configuradas.' }) }
  const payment = await new MercadoPagoPaymentProvider(String(config.mercadoPagoTestAccessToken)).getPayment(paymentId)
  if (!payment.externalReference?.startsWith('admin-test-')) { throw createError({ statusCode: 404, statusMessage: 'Pagamento não pertence ao simulador administrativo' }) }
  return { payment_id: payment.id, status: payment.status, status_detail: payment.statusDetail }
})
