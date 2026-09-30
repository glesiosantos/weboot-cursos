import { z } from 'zod'
import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'
import { loadMercadoPagoProvider, loadPaymentContext, mercadoPagoPayer } from '../../../utils/payment'
import { paymentPrice } from '../../../utils/payment-pricing'

const schema = z.object({
  token: z.string().min(10).max(500),
  payment_method_id: z.string().min(2).max(40),
  issuer_id: z.union([z.string(), z.number()]).optional(),
  installments: z.number().int().min(1).max(6),
}).strict()

export default defineEventHandler(async (event) => {
  enforceRegistrationRateLimit(event, 5, 10 * 60_000)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 400, statusMessage: 'Dados tokenizados do cartão inválidos' }) }
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') { return { paid: true } }
  if (context.order.provider_payment_id || context.order.asaas_payment_id) {
    throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui uma cobrança. Inicie uma nova inscrição para trocar a forma de pagamento.' })
  }
  const config = useRuntimeConfig(event)
  const price = paymentPrice(Number(context.order.unit_price), 'CREDIT_CARD', parsed.data.installments, config)
  const payment = await loadMercadoPagoProvider(event).createCardPayment({
    idempotencyKey: context.order.id, amount: price.total,
    description: `Inscrição - ${context.order.courses?.title ?? 'Curso'}`.slice(0, 150),
    externalReference: context.order.id, notificationUrl: String(config.mercadoPagoWebhookUrl || '') || undefined,
    token: parsed.data.token, paymentMethodId: parsed.data.payment_method_id,
    issuerId: parsed.data.issuer_id === undefined ? undefined : String(parsed.data.issuer_id),
    installments: parsed.data.installments,
    payer: mercadoPagoPayer(context, String(config.registrationDataKey || '')),
  })
  const { error } = await context.admin.from('orders').update({
    total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'CREDIT_CARD', installment_count: parsed.data.installments,
    payment_provider: 'MERCADO_PAGO', provider_payment_id: payment.id,
  }).eq('id', context.order.id).is('provider_payment_id', null).is('asaas_payment_id', null)
  if (error) { throw error }
  return { payment_id: payment.id, status: payment.status, status_detail: payment.statusDetail }
})
