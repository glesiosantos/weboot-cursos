import { createHmac, timingSafeEqual } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { MercadoPagoPaymentProvider } from '../../services/mercado-pago-payment.provider'
import { completeCommercialOrder } from '../../services/complete-order.service'
import { sha256 } from '../../utils/commercial'

type MercadoPagoWebhook = {
  id?: number | string
  action?: string
  type?: string
  live_mode?: boolean
  data?: { id?: number | string }
}

const secureEqual = (received: string, expected: string) => {
  const left = Buffer.from(received)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const validateMercadoPagoSignature = (signature: string, requestId: string, dataId: string, secret: string) => {
  const parts = Object.fromEntries(signature.split(',').map(part => part.trim().split('=', 2)))
  if (!parts.ts || !parts.v1 || !requestId || !dataId || !secret) { return false }
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  return secureEqual(parts.v1, createHmac('sha256', secret).update(manifest).digest('hex'))
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const payload = await readBody<MercadoPagoWebhook>(event)
  const dataId = String(getQuery(event)['data.id'] ?? payload.data?.id ?? '')
  if (payload.type !== 'payment' || !dataId) { return { received: true, ignored: true } }
  if (!validateMercadoPagoSignature(getHeader(event, 'x-signature') || '', getHeader(event, 'x-request-id') || '', dataId, String(config.mercadoPagoWebhookSecret || ''))) {
    throw createError({ statusCode: 401, statusMessage: 'Webhook não autorizado' })
  }
  if (payload.live_mode === false) { return { received: true, simulated: true } }
  if (!config.mercadoPagoAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Pagamento não configurado' }) }
  const payment = await new MercadoPagoPaymentProvider(String(config.mercadoPagoAccessToken)).getPayment(dataId)
  if (!payment.externalReference) { return { received: true, ignored: true } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const eventId = String(payload.id ?? `${payload.action ?? 'payment.updated'}:${payment.id}:${payment.status}`)
  const payloadHash = sha256(JSON.stringify(payload))
  const { error: eventError } = await admin.from('webhook_events').insert({
    provider: 'MERCADO_PAGO', external_event_id: eventId, event_type: payload.action ?? 'payment.updated', payload_hash: payloadHash,
  })
  if (eventError?.code === '23505') {
    const { data: existing } = await admin.from('webhook_events').select('status,payload_hash')
      .eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId).single()
    if (existing?.payload_hash !== payloadHash) { throw createError({ statusCode: 409, statusMessage: 'Evento duplicado com payload divergente' }) }
    if (existing?.status === 'PROCESSED') { return { received: true, duplicate: true } }
  }
  if (eventError && eventError.code !== '23505') { throw createError({ statusCode: 500, statusMessage: 'Falha ao registrar webhook' }) }
  try {
    const { data: order } = await admin.from('orders').select('id,total,payment_provider,provider_payment_id')
      .eq('id', payment.externalReference).single()
    if (!order) { throw createError({ statusCode: 404, statusMessage: 'Pedido do pagamento não encontrado' }) }
    if (order.payment_provider !== 'MERCADO_PAGO' || order.provider_payment_id !== payment.id) {
      throw createError({ statusCode: 409, statusMessage: 'Pagamento não pertence ao pedido' })
    }
    if (payment.value === undefined || Math.round(Number(payment.value) * 100) !== Math.round(Number(order.total) * 100)) {
      throw createError({ statusCode: 409, statusMessage: 'Valor recebido diverge do pedido' })
    }
    if (payment.status === 'approved') {
      await completeCommercialOrder(admin, order.id, payment.id, payment.status, {
        url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
        smtp: { host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || '') },
      })
    }
    else if (['refunded', 'charged_back'].includes(payment.status)) {
      await admin.rpc('cancel_commercial_order', { target_order_id: order.id, new_status: 'REFUNDED' }).throwOnError()
    }
    else if (['cancelled', 'rejected'].includes(payment.status)) {
      await admin.rpc('cancel_commercial_order', { target_order_id: order.id, new_status: 'CANCELED' }).throwOnError()
    }
    await admin.from('webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString() })
      .eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId)
    return { received: true, duplicate: false }
  }
  catch (error) {
    await admin.from('webhook_events').update({ status: 'FAILED', processed_at: new Date().toISOString() })
      .eq('provider', 'MERCADO_PAGO').eq('external_event_id', eventId)
    throw error
  }
})
