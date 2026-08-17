import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../utils/auth'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('orders').select('id,status,paid_at,expires_at,course_id,courses(title,slug)')
    .eq('id', getRouterParam(event, 'id')!).eq('user_id', user.sub).single()
  if (error || !data) { throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' }) }
  return data
})
