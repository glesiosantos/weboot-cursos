import { createHmac, timingSafeEqual } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { MercadoPagoPaymentProvider } from '../../services/mercado-pago-payment.provider'
import { completeCommercialOrder } from '../../services/complete-order.service'
import { sha256 } from '../../utils/commercial'

type Notification = { id?: number | string, type?: string, action?: string, data?: { id?: string } }
const secureEqual = (received: string, expected: string) => {
  const left = Buffer.from(received)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = String(config.mercadoPagoWebhookSecret || '')
  const signature = getHeader(event, 'x-signature') || ''
  const requestId = getHeader(event, 'x-request-id') || ''
  const queryId = getQuery(event)['data.id']
  const payload = await readBody<Notification>(event)
  const paymentId = String(queryId || payload.data?.id || '')
  const parts = Object.fromEntries(signature.split(',').map((part) => {
    const [key, value] = part.trim().split('=', 2)
    return [key, value]
  }))
  if (!secret || !requestId || !paymentId || !parts.ts || !parts.v1) {
    throw createError({ statusCode: 401, statusMessage: 'Webhook não autorizado' })
  }
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  if (!secureEqual(parts.v1, expected)) { throw createError({ statusCode: 401, statusMessage: 'Assinatura do webhook inválida' }) }
  if (payload.type && payload.type !== 'payment') { return { received: true, ignored: true } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const provider = new MercadoPagoPaymentProvider(String(config.mercadoPagoAccessToken || ''))
  const payment = await provider.getPayment(paymentId)
  const eventId = `${paymentId}:${payload.action || 'payment.updated'}`
  const payloadHash = sha256(JSON.stringify(payload))
  const { error: insertError } = await admin.from('webhook_events').insert({
    provider: 'MERCADO_PAGO', external_event_id: eventId, event_type: payload.action || 'payment.updated', payload_hash: payloadHash,
  })
  if (insertError?.code === '23505') {
    const { data: existing } = await admin.from('webhook_events').select('status,payload_hash').eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId).single()
    if (existing?.payload_hash !== payloadHash) { throw createError({ statusCode: 409, statusMessage: 'Evento duplicado com payload divergente' }) }
    if (existing?.status === 'PROCESSED') { return { received: true, duplicate: true } }
  }
  else if (insertError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao registrar webhook' }) }

  try {
    if (payment.externalReference) {
      const { data: order } = await admin.from('orders').select('id,total,provider_payment_id,payment_provider').eq('id', payment.externalReference).maybeSingle()
      if (order && order.payment_provider === 'MERCADO_PAGO' && order.provider_payment_id === payment.id) {
        if (payment.value === undefined || Math.round(payment.value * 100) !== Math.round(Number(order.total) * 100)) {
          throw createError({ statusCode: 409, statusMessage: 'Valor recebido diverge do pedido' })
        }
        if (payment.status === 'approved') {
          await completeCommercialOrder(admin, order.id, payment.id, payment.status, {
            url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
            smtp: { host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || '') },
          })
        }
        else if (payment.status === 'refunded') {
          await admin.rpc('cancel_commercial_order', { target_order_id: order.id, new_status: 'REFUNDED' }).throwOnError()
        }
        else if (['cancelled', 'expired'].includes(payment.status)) {
          const status = payment.status === 'expired' ? 'EXPIRED' : 'CANCELED'
          await admin.rpc('cancel_commercial_order', { target_order_id: order.id, new_status: status }).throwOnError()
        }
      }
    }
    await admin.from('webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString() }).eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId)
    return { received: true }
  }
  catch (error) {
    await admin.from('webhook_events').update({ status: 'FAILED', processed_at: new Date().toISOString() }).eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId)
    throw error
  }
})
