import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { MercadoPagoPaymentProvider } from '../services/mercado-pago-payment.provider'
import { sha256 } from './commercial'
import { revealRegistrationCpf } from './registration'

export const loadPaymentContext = async (event: H3Event) => {
  const reference = getRouterParam(event, 'reference') || ''
  if (!/^[A-Za-z0-9_-]{32}$/.test(reference)) { throw createError({ statusCode: 404, statusMessage: 'Pagamento não encontrado' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: order } = await admin.from('orders').select('*,courses(title)').eq('public_reference_hash', sha256(reference)).single()
  if (!order) { throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' }) }
  const { data: contact } = await admin.from('registration_contacts').select('*').eq('id', order.registration_id).single()
  if (!contact) { throw createError({ statusCode: 404, statusMessage: 'Participante não encontrado' }) }
  if (order.status !== 'PAID' && order.expires_at && new Date(order.expires_at).getTime() <= Date.now()) {
    throw createError({ statusCode: 410, statusMessage: 'A reserva expirou. Inicie uma nova inscrição.' })
  }
  return { admin, contact, order, reference }
}

export const loadMercadoPagoProvider = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  if (!config.mercadoPagoAccessToken) { throw createError({ statusCode: 503, statusMessage: 'Pagamento não configurado' }) }
  return new MercadoPagoPaymentProvider(String(config.mercadoPagoAccessToken))
}

export const mercadoPagoPayer = (context: Awaited<ReturnType<typeof loadPaymentContext>>, registrationDataKey: string) => {
  const [parsedFirstName, ...remainingNames] = String(context.contact.full_name).trim().split(/\s+/)
  const firstName = parsedFirstName || 'Cliente'
  return {
    email: context.contact.email,
    firstName,
    lastName: remainingNames.join(' ') || firstName,
    cpf: revealRegistrationCpf(context.contact.cpf_encrypted, registrationDataKey).replace(/\D/g, ''),
  }
}
