import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('courses').select('*,course_presential_details(*)').eq('id', id).single()
  if (error || !data) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  return data
})
