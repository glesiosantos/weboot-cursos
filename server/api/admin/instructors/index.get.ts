import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('instructors').select('*').order('name')
  if (error) { throw createError({ statusCode: 500, statusMessage: error.message }) }
  return data
})
