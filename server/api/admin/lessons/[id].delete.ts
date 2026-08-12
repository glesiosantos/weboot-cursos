import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data: lesson, error: lessonError } = await client.from('lessons').select('video_path').eq('id', id).single()
  if (lessonError || !lesson) { throw createError({ statusCode: 404, statusMessage: 'Aula não encontrada' }) }
  const { data: materials, error: materialError } = await client.from('course_materials').select('file_path').eq('lesson_id', id)
  if (materialError) { throw createError({ statusCode: 422, statusMessage: materialError.message }) }
  const { error } = await client.from('lessons').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  if (lesson.video_path) { await client.storage.from('course-videos').remove([lesson.video_path]) }
  const files = (materials ?? []).map(material => material.file_path)
  if (files.length) { await client.storage.from('course-materials').remove(files) }
  return { removed: true }
})
