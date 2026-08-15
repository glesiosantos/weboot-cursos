import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { AsaasHostedCheckoutProvider } from '../services/asaas-hosted-checkout.provider'
import { completeCommercialOrder } from '../services/complete-order.service'
import { requireUser } from '../utils/auth'
import { normalizeCommercialError } from '../utils/commercial'

const checkoutSchema = z.object({ course_id: z.uuid() }).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = checkoutSchema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 400, statusMessage: 'Curso inválido' }) }
  const config = useRuntimeConfig(event)
  // The generated Supabase types are refreshed only after this migration is applied.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: profile, error: profileError } = await admin.from('profiles').select('name,phone,role').eq('id', user.sub).single()
  if (profileError || !profile) { throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' }) }
  if (profile.role !== 'STUDENT') { throw createError({ statusCode: 403, statusMessage: 'Compra disponível somente para alunos' }) }
  if (!profile.name?.trim() || !profile.phone?.trim() || !user.email) {
    throw createError({ statusCode: 422, statusMessage: 'Complete nome e telefone no seu perfil antes de comprar', data: { redirect: '/aluno/perfil' } })
  }
  const reservationMinutes = 30
  const { data, error } = await admin.rpc('prepare_checkout_order', {
    target_user_id: user.sub, target_course_id: body.data.course_id, reservation_minutes: reservationMinutes,
  })
  if (error || !data?.[0]) { throw normalizeCommercialError(error?.message ?? 'order preparation failed') }
  const order = data[0]
  if (order.reused) {
    const { data: existing } = await admin.from('orders').select('asaas_checkout_url').eq('id', order.order_id).single()
    if (existing?.asaas_checkout_url) { return { order_id: order.order_id, checkout_url: existing.asaas_checkout_url, reused: true } }
    setResponseHeader(event, 'retry-after', 2)
    throw createError({ statusCode: 409, statusMessage: 'Checkout em preparação. Tente novamente em alguns segundos.' })
  }
  if (Number(order.unit_price) === 0) {
    await completeCommercialOrder(admin, order.order_id, `free:${order.order_id}`, 'FREE', {
      url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
    })
    return { order_id: order.order_id, checkout_url: `/checkout/retorno?pedido=${encodeURIComponent(order.order_id)}`, reused: false }
  }
  if (!config.asaasApiKey) {
    await admin.rpc('cancel_commercial_order', { target_order_id: order.order_id, new_status: 'CANCELED' })
    throw createError({ statusCode: 503, statusMessage: 'Checkout não configurado' })
  }
  try {
    const provider = new AsaasHostedCheckoutProvider(String(config.asaasApiUrl), String(config.asaasApiKey))
    const checkout = await provider.createHostedCheckout({
      orderId: order.order_id, courseId: body.data.course_id, courseTitle: order.course_title,
      amount: Number(order.unit_price), expiresInMinutes: reservationMinutes,
      callbackUrl: `${String(config.public.appUrl).replace(/\/$/, '')}/checkout/retorno?pedido=${encodeURIComponent(order.order_id)}`,
    })
    const { error: updateError } = await admin.from('orders').update({
      status: 'WAITING_PAYMENT', asaas_checkout_id: checkout.id, asaas_checkout_url: checkout.url,
    }).eq('id', order.order_id)
    if (updateError) { throw updateError }
    return { order_id: order.order_id, checkout_url: checkout.url, reused: false }
  }
  catch (error) {
    await admin.rpc('cancel_commercial_order', { target_order_id: order.order_id, new_status: 'CANCELED' })
    throw error
  }
})
