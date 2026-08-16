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
  const { data: materials, error: materialsError } = await client.from('course_materials').select('id,title,mime_type,file_size,created_at').eq('course_id', id).is('module_id', null).is('lesson_id', null).order('created_at', { ascending: false })
  if (materialsError) { throw createError({ statusCode: 500, statusMessage: materialsError.message }) }
  return { course, modules, materials }
})
