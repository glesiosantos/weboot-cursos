import { z } from 'zod'
import { enforceRegistrationRateLimit } from '../../../utils/rate-limit'
import { ensureAsaasCustomer, loadPaymentContext } from '../../../utils/payment'
import { paymentPrice } from '../../../utils/payment-pricing'

const digits = (value: string) => value.replace(/\D/g, '')
const luhn = (value: string) => {
  const numbers = digits(value).split('').reverse().map(Number)
  return numbers.length >= 13 && numbers.length <= 19 && numbers.reduce((sum, number, index) => {
    const doubled = index % 2 ? number * 2 : number
    return sum + (doubled > 9 ? doubled - 9 : doubled)
  }, 0) % 10 === 0
}
const schema = z.object({
  holder_name: z.string().trim().min(3).max(100),
  number: z.string().refine(luhn, 'Número do cartão inválido').transform(digits),
  expiry_month: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiry_year: z.string().regex(/^\d{4}$/),
  ccv: z.string().regex(/^\d{3,4}$/),
  installments: z.number().int().min(1).max(6),
}).strict()

export default defineEventHandler(async (event) => {
  enforceRegistrationRateLimit(event, 5, 10 * 60_000)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dados do cartão inválidos' }) }
  const context = await loadPaymentContext(event)
  if (context.order.status === 'PAID') { return { paid: true } }
  if (context.order.asaas_payment_id) { throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui uma cobrança. Inicie uma nova inscrição para trocar a forma de pagamento.' }) }
  const config = useRuntimeConfig(event)
  const price = paymentPrice(Number(context.order.unit_price), 'CREDIT_CARD', parsed.data.installments, config)
  const { provider, customerId } = await ensureAsaasCustomer(event, context)
  const cpf = context.contact.cpf_encrypted
  const { revealRegistrationCpf } = await import('../../../utils/registration')
  const payment = await provider.createCardPayment({
    customer: customerId, value: price.total, dueDate: new Date().toISOString().slice(0, 10),
    description: `Inscrição - ${context.order.courses?.title ?? 'Curso'}`.slice(0, 500), externalReference: context.order.id,
    installmentCount: parsed.data.installments,
    creditCard: { holderName: parsed.data.holder_name, number: parsed.data.number, expiryMonth: parsed.data.expiry_month, expiryYear: parsed.data.expiry_year, ccv: parsed.data.ccv },
    creditCardHolderInfo: {
      name: parsed.data.holder_name, email: context.contact.email,
      cpfCnpj: revealRegistrationCpf(cpf, String(config.registrationDataKey || '')),
      postalCode: '64000000', addressNumber: '10',
      phone: context.contact.whatsapp.replace(/\D/g, ''), mobilePhone: context.contact.whatsapp.replace(/\D/g, ''),
    },
    remoteIp: getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1',
  })
  const { error } = await context.admin.from('orders').update({
    total: price.total, provider_fee: price.providerFee, service_fee: price.serviceFee,
    payment_method: 'CREDIT_CARD', installment_count: parsed.data.installments, asaas_payment_id: payment.id,
  }).eq('id', context.order.id).is('asaas_payment_id', null)
  if (error) { throw error }
  return { payment_id: payment.id, status: payment.status ?? 'PENDING' }
})
