import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const config = useRuntimeConfig(event)
  return {
    configured: Boolean(config.mercadoPagoTestAccessToken && config.public.mercadoPagoTestPublicKey),
    publicKey: String(config.public.mercadoPagoTestPublicKey || ''),
  }
})
