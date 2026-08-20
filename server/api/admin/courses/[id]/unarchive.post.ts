import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client
    .from('courses')
    .update({ archived_at: null })
    .eq('id', id)
    .not('archived_at', 'is', null)
    .select()
    .maybeSingle()

  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  if (!data) { throw createError({ statusCode: 404, statusMessage: 'Curso arquivado não encontrado' }) }
  return data
})
