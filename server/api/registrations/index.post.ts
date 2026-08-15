import { randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { AsaasHostedCheckoutProvider } from '../../services/asaas-hosted-checkout.provider'
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
  if (order.reused) {
    const { data: existing } = await admin.from('orders').select('asaas_checkout_url,registration_id').eq('id', order.order_id).single()
    if (existing?.asaas_checkout_url) { return { checkout_url: existing.asaas_checkout_url, reused: true } }
    throw createError({ statusCode: 409, statusMessage: 'Já existe uma inscrição pendente para estes dados.' })
  }
  const returnUrl = `${String(config.public.appUrl).replace(/\/$/, '')}/inscricao/retorno?referencia=${encodeURIComponent(reference)}`
  if (Number(order.unit_price) === 0) {
    await completeCommercialOrder(admin, order.order_id, `free:${order.order_id}`, 'FREE', {
      url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
    })
    return { checkout_url: `/inscricao/${encodeURIComponent(reference)}/confirmada`, free: true }
  }
  if (!config.asaasApiKey) { await admin.rpc('cancel_commercial_order', { target_order_id: order.order_id, new_status: 'CANCELED' }); throw createError({ statusCode: 503, statusMessage: 'Checkout não configurado' }) }
  try {
    const provider = new AsaasHostedCheckoutProvider(String(config.asaasApiUrl), String(config.asaasApiKey))
    const checkout = await provider.createHostedCheckout({
      orderId: order.order_id, courseId: parsed.data.course_id, courseTitle: order.course_title,
      amount: Number(order.unit_price), expiresInMinutes: reservationMinutes,
      callbackUrl: returnUrl,
    })
    const { error: updateError } = await admin.from('orders').update({ status: 'WAITING_PAYMENT', asaas_checkout_id: checkout.id, asaas_checkout_url: checkout.url }).eq('id', order.order_id)
    if (updateError) { throw updateError }
    return { checkout_url: checkout.url, reused: false }
  }
  catch (error) {
    await admin.rpc('cancel_commercial_order', { target_order_id: order.order_id, new_status: 'CANCELED' })
    throw error
  }
})
