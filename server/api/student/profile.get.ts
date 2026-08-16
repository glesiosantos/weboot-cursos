import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../utils/auth'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('profiles').select('name,phone,role').eq('id', user.sub).single()
  if (error || !data) { throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' }) }
  return { ...data, email: user.email }
})
