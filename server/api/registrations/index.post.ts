import { randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { completeCommercialOrder } from '../../services/complete-order.service'
import { z } from 'zod'
import { normalizeCommercialError, sha256 } from '../../utils/commercial'
import { enforceRegistrationRateLimit } from '../../utils/rate-limit'
import { guestRegistrationSchema, protectRegistration } from '../../utils/registration'

export default defineEventHandler(async (event) => {
  enforceRegistrationRateLimit(event)
  const body = await readBody(event)
  const user = await serverSupabaseUser(event)
  const authenticatedParsed = user
    ? z.object({
        course_id: z.uuid('Curso inválido'),
        terms_accepted: z.literal(true, 'Aceite os Termos de Uso e a Política de Privacidade'),
        voucher_code: z.string().trim().max(40).transform(value => value.toUpperCase()).optional(),
      }).strict().safeParse(body)
    : null
  if (user && !authenticatedParsed?.success) {
    throw createError({ statusCode: 400, statusMessage: authenticatedParsed?.error.issues[0]?.message ?? 'Dados inválidos' })
  }
  if (user) {
    const config = useRuntimeConfig(event)
    const reference = randomBytes(24).toString('base64url')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = serverSupabaseServiceRole(event) as any
    const { data: contact, error: contactError } = await admin.from('registration_contacts').select('*').eq('user_id', user.sub).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (contactError) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar seus dados de matrícula' }) }
    if (!contact) { throw createError({ statusCode: 409, statusMessage: 'Não encontramos os dados da sua matrícula anterior. Fale com o suporte para vincular sua conta.' }) }
    if (!authenticatedParsed?.success) { throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' }) }
    const input = authenticatedParsed.data
    const { data, error } = await admin.rpc('prepare_guest_checkout_order', {
      target_course_id: input.course_id,
      participant_name: contact.full_name,
      participant_email: contact.email,
      participant_whatsapp: contact.whatsapp,
      participant_cpf_hash: contact.cpf_hash,
      participant_cpf_encrypted: contact.cpf_encrypted,
      reference_hash: sha256(reference),
      accepted_terms_version: '2026-08-13',
      accepted_marketing: contact.marketing_accepted,
      reservation_minutes: 30,
      target_coupon_code: input.voucher_code ?? null,
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
  }
  const parsed = guestRegistrationSchema.safeParse(body)
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
    target_coupon_code: parsed.data.voucher_code ?? null,
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
