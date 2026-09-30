import { randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { completeCommercialOrder } from '../../../../../services/complete-order.service'
import { requireRole } from '../../../../../utils/auth'
import { normalizeCommercialError, sha256 } from '../../../../../utils/commercial'
import { isValidCpf, normalizeWhatsapp, protectRegistration } from '../../../../../utils/registration'

const schema = z.object({
  full_name: z.string().trim().min(6, 'Informe o nome completo').max(150),
  cpf: z.string().refine(isValidCpf, 'CPF inválido').transform(value => value.replace(/\D/g, '')),
  email: z.email('Email inválido').transform(value => value.trim().toLowerCase()),
  whatsapp: z.string().transform(normalizeWhatsapp).refine(value => value !== null, 'WhatsApp inválido'),
  payment_method: z.enum(['PIX', 'TRANSFER', 'CASH', 'OTHER']),
  payment_reference: z.string().trim().min(3, 'Informe a referência do pagamento').max(100),
  amount_received: z.coerce.number().positive('Informe o valor recebido'),
  customer_authorized: z.literal(true, 'Confirme a autorização do cliente'),
}).strict()

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const { user } = await requireRole(event, ['ADMIN'])
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dados inválidos', data: parsed.error.flatten() })
  }

  const config = useRuntimeConfig(event)
  const protectedCpf = protectRegistration(parsed.data.cpf, String(config.registrationDataKey || ''))
  const publicReference = randomBytes(24).toString('base64url')
  const externalPaymentId = `manual:${parsed.data.payment_reference}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any

  const { data, error } = await admin.rpc('prepare_guest_checkout_order', {
    target_course_id: courseId,
    participant_name: parsed.data.full_name,
    participant_email: parsed.data.email,
    participant_whatsapp: parsed.data.whatsapp,
    participant_cpf_hash: protectedCpf.cpfHash,
    participant_cpf_encrypted: protectedCpf.cpfEncrypted,
    reference_hash: sha256(publicReference),
    accepted_terms_version: 'ADMIN_ASSISTED-2026-09-02',
    accepted_marketing: false,
    reservation_minutes: 30,
  })
  if (error || !data?.[0]) { throw normalizeCommercialError(error?.message ?? 'Não foi possível preparar a matrícula') }

  const order = data[0]
  const { data: persistedOrder, error: persistedOrderError } = await admin.from('orders')
    .select('total,payment_provider,provider_payment_id').eq('id', order.order_id).single()
  if (persistedOrderError || !persistedOrder) { throw persistedOrderError ?? new Error('Pedido não encontrado') }
  if (persistedOrder.provider_payment_id && persistedOrder.payment_provider !== 'MANUAL') {
    throw createError({ statusCode: 409, statusMessage: 'Este pedido já possui uma cobrança vinculada. Confirme-a pelo provedor original.' })
  }
  if (Math.abs(Number(persistedOrder.total) - parsed.data.amount_received) > 0.009) {
    throw createError({ statusCode: 409, statusMessage: `O valor recebido deve ser ${Number(persistedOrder.total).toFixed(2)}` })
  }

  const { error: paymentLinkError } = await admin.from('orders').update({
    public_reference_hash: sha256(publicReference),
    payment_provider: 'MANUAL',
    provider_payment_id: externalPaymentId,
  }).eq('id', order.order_id).in('status', ['PENDING', 'WAITING_PAYMENT'])
  if (paymentLinkError) {
    if (paymentLinkError.code === '23505') { throw createError({ statusCode: 409, statusMessage: 'Esta referência de pagamento já foi utilizada' }) }
    throw paymentLinkError
  }

  const result = await completeCommercialOrder(admin, order.order_id, externalPaymentId, 'CONFIRMED_MANUALLY', {
    url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
    smtp: { host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || '') },
  })
  const enrollmentId = result.enrollmentId
  const { error: auditError } = await admin.from('audit_logs').insert({
    user_id: user.sub, action: 'MANUAL_ENROLLMENT_PAYMENT_CONFIRMED', entity: 'enrollment', entity_id: enrollmentId,
    metadata: { order_id: order.order_id, course_id: courseId, payment_method: parsed.data.payment_method, payment_reference: parsed.data.payment_reference, amount_received: parsed.data.amount_received },
  })
  return { enrollmentId, orderId: order.order_id, passwordSetupSent: result.passwordSetupSent, auditLogged: !auditError }
})
