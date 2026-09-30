import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { MercadoPagoPaymentProvider } from '../../../services/mercado-pago-payment.provider'
import { requireRole } from '../../../utils/auth'
import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'

const payerSchema = {
  amount: z.number().positive().max(10000),
  email: z.email().max(254),
  full_name: z.string().trim().min(3).max(100),
  cpf: z.string().regex(/^\d{11}$/),
}
const schema = z.discriminatedUnion('method', [
  z.object({ ...payerSchema, method: z.literal('PIX') }).strict(),
  z.object({
    ...payerSchema, method: z.literal('CREDIT_CARD'), token: z.string().min(10).max(500),
    payment_method_id: z.string().min(2).max(40), issuer_id: z.union([z.string(), z.number()]).optional(),
    installments: z.number().int().min(1).max(24),
  }).strict(),
])

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  enforceRegistrationRateLimit(event, 10, 10 * 60_000)
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoTestAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Configure a credencial de teste do Mercado Pago no servidor.' }) }
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dados de teste inválidos' }) }
  const provider = new MercadoPagoPaymentProvider(String(config.mercadoPagoTestAccessToken))
  const names = parsed.data.full_name.trim().split(/\s+/)
  const payer = { email: parsed.data.email, firstName: names[0] || 'Teste', lastName: names.slice(1).join(' ') || 'Pagamento', cpf: parsed.data.cpf }
  const externalReference = `admin-test-${randomUUID()}`
  const idempotencyKey = randomUUID()
  const description = 'WeBoot - teste de integração de pagamento'
  if (parsed.data.method === 'PIX') {
    const payment = await provider.createPixPayment({
      idempotencyKey, amount: Math.round(parsed.data.amount * 100) / 100, description, externalReference,
      expirationDate: new Date(Date.now() + 30 * 60_000).toISOString(), payer,
    })
    return { payment_id: payment.id, status: payment.status, status_detail: payment.statusDetail, encoded_image: payment.encodedImage, payload: payment.payload, ticket_url: payment.ticketUrl }
  }
  const payment = await provider.createCardPayment({
    idempotencyKey, amount: Math.round(parsed.data.amount * 100) / 100, description, externalReference,
    token: parsed.data.token,
    paymentMethodId: parsed.data.payment_method_id,
    issuerId: parsed.data.issuer_id === undefined ? undefined : String(parsed.data.issuer_id),
    installments: parsed.data.installments, payer,
  })
  return { payment_id: payment.id, status: payment.status, status_detail: payment.statusDetail }
})
