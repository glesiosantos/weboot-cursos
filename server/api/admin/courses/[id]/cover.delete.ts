import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error } = await client.from('courses').select('cover_path').eq('id', id).single()
  if (error || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { error: updateError } = await client.from('courses').update({ cover_path: null }).eq('id', id)
  if (updateError) { throw createError({ statusCode: 400, statusMessage: updateError.message }) }
  const storageRemoved = course.cover_path
    ? !(await client.storage.from('course-covers').remove([course.cover_path])).error
    : true
  return { removed: true, storage_removed: storageRemoved }
})
