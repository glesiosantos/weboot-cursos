import { serverSupabaseServiceRole } from '#supabase/server'
import { sha256 } from '../../utils/commercial'

export default defineEventHandler(async (event) => {
  const reference = getRouterParam(event, 'reference') || ''
  if (!/^[A-Za-z0-9_-]{32}$/.test(reference)) { throw createError({ statusCode: 404, statusMessage: 'Inscrição não encontrada' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.rpc('get_registration_status', { reference_hash: sha256(reference) })
  if (error || !data?.[0]) { throw createError({ statusCode: 404, statusMessage: 'Inscrição não encontrada' }) }
  return data[0]
})
