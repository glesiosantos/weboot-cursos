import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient<Database>(event) as any
  const { data, error } = await client.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar vouchers' }) }
  return data
})
