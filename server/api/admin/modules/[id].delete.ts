import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data: lessons, error: lessonError } = await client.from('lessons').select('id,video_path').eq('module_id', id)
  if (lessonError) { throw createError({ statusCode: 422, statusMessage: lessonError.message }) }
  const { data: moduleMaterials, error: moduleMaterialError } = await client.from('course_materials').select('file_path').eq('module_id', id)
  if (moduleMaterialError) { throw createError({ statusCode: 422, statusMessage: moduleMaterialError.message }) }
  const lessonIds = (lessons ?? []).map(lesson => lesson.id)
  const { data: lessonMaterials, error: lessonMaterialError } = lessonIds.length
    ? await client.from('course_materials').select('file_path').in('lesson_id', lessonIds)
    : { data: [], error: null }
  if (lessonMaterialError) { throw createError({ statusCode: 422, statusMessage: lessonMaterialError.message }) }
  const { error } = await client.from('course_modules').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  const videos = (lessons ?? []).flatMap(lesson => lesson.video_path ? [lesson.video_path] : [])
  const files = [...(moduleMaterials ?? []), ...(lessonMaterials ?? [])].map(material => material.file_path)
  if (videos.length) { await client.storage.from('course-videos').remove(videos) }
  if (files.length) { await client.storage.from('course-materials').remove(files) }
  return { removed: true }
})
