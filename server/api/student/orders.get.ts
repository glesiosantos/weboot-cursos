import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../utils/auth'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('orders')
    .select('id,course_id,status,total,currency,created_at,expires_at,asaas_checkout_url,courses(title,slug)')
    .eq('user_id', user.sub).order('created_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar seus pedidos' }) }
  return data
})
