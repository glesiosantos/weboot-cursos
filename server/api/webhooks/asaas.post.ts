import { timingSafeEqual } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sha256 } from '../../utils/commercial'
import { completeCommercialOrder } from '../../services/complete-order.service'

type AsaasWebhook = {
  id?: string
  event?: string
  payment?: { id?: string, externalReference?: string, status?: string, value?: number }
  checkout?: { id?: string, externalReference?: string, status?: string }
}

const secureEqual = (received: string, expected: string) => {
  const left = Buffer.from(received)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const expectedToken = String(config.asaasWebhookToken || '')
  const receivedToken = getHeader(event, 'asaas-access-token') || ''
  if (!expectedToken || !secureEqual(receivedToken, expectedToken)) { throw createError({ statusCode: 401, statusMessage: 'Webhook não autorizado' }) }
  const payload = await readBody<AsaasWebhook>(event)
  if (!payload.id || !payload.event) { throw createError({ statusCode: 400, statusMessage: 'Evento inválido' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const payloadHash = sha256(JSON.stringify(payload))
  const { error: eventError } = await admin.from('webhook_events').insert({
    provider: 'ASAAS', external_event_id: payload.id, event_type: payload.event, payload_hash: payloadHash,
  })
  if (eventError?.code === '23505') {
    const { data: existing } = await admin.from('webhook_events').select('status,payload_hash')
      .eq('provider', 'ASAAS').eq('external_event_id', payload.id).single()
    if (existing?.payload_hash !== payloadHash) { throw createError({ statusCode: 409, statusMessage: 'Evento duplicado com payload divergente' }) }
    if (existing?.status === 'PROCESSED') { return { received: true, duplicate: true } }
  }
  if (eventError && eventError.code !== '23505') { throw createError({ statusCode: 500, statusMessage: 'Falha ao registrar webhook' }) }
  let externalReference = payload.payment?.externalReference ?? payload.checkout?.externalReference
  if (!externalReference && payload.checkout?.id) {
    const { data: order } = await admin.from('orders').select('id').eq('asaas_checkout_id', payload.checkout.id).maybeSingle()
    externalReference = order?.id
  }
  const paymentId = payload.payment?.id ?? (payload.checkout?.id ? `checkout:${payload.checkout.id}` : undefined)
  try {
    if (externalReference) {
      if (['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'CHECKOUT_PAID'].includes(payload.event) && paymentId) {
        const { data: expectedOrder } = await admin.from('orders').select('total,asaas_payment_id').eq('id', externalReference).single()
        if (!expectedOrder) { throw createError({ statusCode: 404, statusMessage: 'Pedido do pagamento não encontrado' }) }
        if (payload.payment) {
          if (expectedOrder.asaas_payment_id !== payload.payment.id) { throw createError({ statusCode: 409, statusMessage: 'Pagamento não pertence ao pedido' }) }
          if (payload.payment.value === undefined || Math.round(Number(payload.payment.value) * 100) !== Math.round(Number(expectedOrder.total) * 100)) {
            throw createError({ statusCode: 409, statusMessage: 'Valor recebido diverge do pedido' })
          }
        }
        await completeCommercialOrder(admin, externalReference, paymentId, payload.payment?.status ?? payload.event, {
          url: String(config.notificationWebhookUrl || ''), token: String(config.notificationWebhookToken || ''), appUrl: String(config.public.appUrl),
        })
      }
      else if (['PAYMENT_REFUNDED', 'PAYMENT_REFUND_IN_PROGRESS'].includes(payload.event)) {
        await admin.rpc('cancel_commercial_order', { target_order_id: externalReference, new_status: 'REFUNDED' }).throwOnError()
      }
      else if (['PAYMENT_DELETED', 'PAYMENT_OVERDUE', 'CHECKOUT_CANCELED', 'CHECKOUT_EXPIRED'].includes(payload.event)) {
        const status = payload.event.includes('EXPIRED') || payload.event === 'PAYMENT_OVERDUE' ? 'EXPIRED' : 'CANCELED'
        await admin.rpc('cancel_commercial_order', { target_order_id: externalReference, new_status: status }).throwOnError()
      }
    }
    await admin.from('webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString() })
      .eq('provider', 'ASAAS').eq('external_event_id', payload.id)
    return { received: true, duplicate: false }
  }
  catch (error) {
    await admin.from('webhook_events').update({ status: 'FAILED', processed_at: new Date().toISOString() })
      .eq('provider', 'ASAAS').eq('external_event_id', payload.id)
    throw error
  }
})
