import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { completeCommercialOrder } from '../../../../../../services/complete-order.service'
import { requireRole } from '../../../../../../utils/auth'

const schema = z.object({
  payment_method: z.enum(['PIX', 'TRANSFER', 'CASH', 'OTHER']),
  payment_reference: z.string().trim().min(3, 'Informe a referência do pagamento').max(100),
  receipt_note: z.string().trim().min(3, 'Informe onde ou como o valor foi recebido').max(500),
  amount_received: z.coerce.number().positive('Informe o valor recebido'),
  customer_authorized: z.literal(true, 'Confirme a autorização do cliente'),
}).strict()

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const orderId = z.uuid().parse(getRouterParam(event, 'orderId'))
  const { user } = await requireRole(event, ['ADMIN'])
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Dados inválidos', data: parsed.error.flatten() })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: order, error } = await admin.from('orders')
    .select('id,course_id,status,total,payment_provider,provider_payment_id').eq('id', orderId).eq('course_id', courseId).single()
  if (error || !order) { throw createError({ statusCode: 404, statusMessage: 'Inscrição não encontrada' }) }
  if (order.status === 'PAID') { throw createError({ statusCode: 409, statusMessage: 'Este pagamento já foi confirmado' }) }
  if (!['PENDING', 'WAITING_PAYMENT', 'EXPIRED', 'CANCELED'].includes(order.status)) {
    throw createError({ statusCode: 409, statusMessage: 'Esta inscrição não pode ser confirmada' })
  }
  if (order.provider_payment_id && order.payment_provider !== 'MANUAL') {
    throw createError({ statusCode: 409, statusMessage: 'Este pedido possui uma cobrança vinculada. Confirme-a pelo provedor original.' })
  }
  if (Math.abs(Number(order.total) - parsed.data.amount_received) > 0.009) {
    throw createError({ statusCode: 409, statusMessage: `O valor recebido deve ser ${Number(order.total).toFixed(2)}` })
  }

  const externalPaymentId = `manual:${parsed.data.payment_reference}`
  const { data: linkedOrder, error: linkError } = await admin.from('orders').update({
    payment_provider: 'MANUAL', provider_payment_id: externalPaymentId,
  }).eq('id', orderId).eq('course_id', courseId).in('status', ['PENDING', 'WAITING_PAYMENT', 'EXPIRED', 'CANCELED'])
    .select('id').single()
  if (linkError || !linkedOrder) {
    if (linkError?.code === '23505') { throw createError({ statusCode: 409, statusMessage: 'Esta referência de pagamento já foi utilizada' }) }
    throw linkError ?? createError({ statusCode: 409, statusMessage: 'A inscrição foi alterada por outra operação' })
  }

  const config = useRuntimeConfig(event)
  const result = await completeCommercialOrder(admin, orderId, externalPaymentId, 'CONFIRMED_MANUALLY', {
    url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
    smtp: { host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || '') },
  })
  const { error: auditError } = await admin.from('audit_logs').insert({
    user_id: user.sub, action: 'MANUAL_ENROLLMENT_PAYMENT_CONFIRMED', entity: 'enrollment', entity_id: result.enrollmentId,
    metadata: { order_id: orderId, course_id: courseId, payment_method: parsed.data.payment_method, payment_reference: parsed.data.payment_reference, receipt_note: parsed.data.receipt_note, amount_received: parsed.data.amount_received },
  })
  return { enrollmentId: result.enrollmentId, passwordSetupSent: result.passwordSetupSent, auditLogged: !auditError }
})
