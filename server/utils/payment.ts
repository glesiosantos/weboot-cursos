import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { AsaasTransparentPaymentProvider } from '../services/asaas-transparent-payment.provider'
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

export const ensureAsaasCustomer = async (event: H3Event, context: Awaited<ReturnType<typeof loadPaymentContext>>) => {
  const config = useRuntimeConfig(event)
  if (!config.asaasApiKey) { throw createError({ statusCode: 503, statusMessage: 'Pagamento não configurado' }) }
  const provider = new AsaasTransparentPaymentProvider(String(config.asaasApiUrl), String(config.asaasApiKey))
  if (context.contact.asaas_customer_id) { return { provider, customerId: context.contact.asaas_customer_id as string } }
  const cpf = revealRegistrationCpf(context.contact.cpf_encrypted, String(config.registrationDataKey || ''))
  const customerId = await provider.createCustomer({
    name: context.contact.full_name, cpfCnpj: cpf, email: context.contact.email,
    mobilePhone: context.contact.whatsapp.replace(/\D/g, ''),
    externalReference: context.contact.id,
  })
  const { error } = await context.admin.from('registration_contacts').update({ asaas_customer_id: customerId }).eq('id', context.contact.id)
  if (error) { throw error }
  return { provider, customerId }
}
