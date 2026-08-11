import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error } = await client.from('courses').select('id,title,course_type').eq('id', id).single()
  if (error || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  if (course.course_type !== 'ONLINE') { throw createError({ statusCode: 422, statusMessage: 'Conteúdo modular é exclusivo de cursos online' }) }
  const { data: modules, error: contentError } = await client.from('course_modules').select('*,lessons(*)').eq('course_id', id).order('position').order('position', { referencedTable: 'lessons' })
  if (contentError) { throw createError({ statusCode: 500, statusMessage: contentError.message }) }
  return { course, modules }
})
