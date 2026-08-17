import { randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { completeCommercialOrder } from '../../services/complete-order.service'
import { normalizeCommercialError, sha256 } from '../../utils/commercial'
import { enforceRegistrationRateLimit } from '../../utils/rate-limit'
import { guestRegistrationSchema, protectRegistration } from '../../utils/registration'

export default defineEventHandler(async (event) => {
  enforceRegistrationRateLimit(event)
  const parsed = guestRegistrationSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dados inválidos', data: parsed.error.flatten() })
  }
  const config = useRuntimeConfig(event)
  const reference = randomBytes(24).toString('base64url')
  const protectedCpf = protectRegistration(parsed.data.cpf, String(config.registrationDataKey || ''))
  const reservationMinutes = 30
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.rpc('prepare_guest_checkout_order', {
    target_course_id: parsed.data.course_id,
    participant_name: parsed.data.full_name,
    participant_email: parsed.data.email,
    participant_whatsapp: parsed.data.whatsapp,
    participant_cpf_hash: protectedCpf.cpfHash,
    participant_cpf_encrypted: protectedCpf.cpfEncrypted,
    reference_hash: sha256(reference),
    accepted_terms_version: '2026-08-13',
    accepted_marketing: parsed.data.marketing_accepted,
    reservation_minutes: reservationMinutes,
  })
  if (error || !data?.[0]) { throw normalizeCommercialError(error?.message ?? 'order preparation failed') }
  const order = data[0]
  const { error: referenceError } = await admin.from('orders').update({ public_reference_hash: sha256(reference) }).eq('id', order.order_id)
  if (referenceError) { throw referenceError }
  if (Number(order.unit_price) === 0) {
    await completeCommercialOrder(admin, order.order_id, `free:${order.order_id}`, 'FREE', {
      url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
      smtp: { host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || '') },
    })
    return { checkout_url: `/inscricao/${encodeURIComponent(reference)}/confirmada`, free: true }
  }
  return { checkout_url: `/pagamento/${encodeURIComponent(reference)}`, reused: order.reused }
})
