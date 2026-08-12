import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

const videoSchema = z.object({ type: z.enum(['video/mp4', 'video/webm']), size: z.number().int().positive().max(1024 * 1024 * 1024) })
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const lessonId = z.uuid().parse(getRouterParam(event, 'id'))
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')
  if (!file?.data || !file.type) { throw createError({ statusCode: 422, statusMessage: 'Selecione um vídeo' }) }
  const parsed = videoSchema.safeParse({ type: file.type, size: file.data.byteLength })
  if (!parsed.success) { throw createError({ statusCode: 415, statusMessage: 'Use MP4 ou WEBM de até 1 GB' }) }
  const client = await serverSupabaseClient<Database>(event)
  const { data: lesson, error: lessonError } = await client.from('lessons').select('module_id,video_path,course_modules(course_id)').eq('id', lessonId).single()
  const moduleRelation = Array.isArray(lesson?.course_modules) ? lesson.course_modules[0] : lesson?.course_modules
  if (lessonError || !moduleRelation) { throw createError({ statusCode: 404, statusMessage: 'Aula não encontrada' }) }
  const extension = parsed.data.type === 'video/mp4' ? 'mp4' : 'webm'
  const path = `courses/${moduleRelation.course_id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await client.storage.from('course-videos').upload(path, file.data, { contentType: parsed.data.type })
  if (uploadError) { throw createError({ statusCode: 400, statusMessage: uploadError.message }) }
  const { error } = await client.from('lessons').update({ lesson_type: 'VIDEO', video_path: path }).eq('id', lessonId)
  if (error) { await client.storage.from('course-videos').remove([path]); throw createError({ statusCode: 400, statusMessage: error.message }) }
  if (lesson.video_path && lesson.video_path !== path) { await client.storage.from('course-videos').remove([lesson.video_path]) }
  return { ok: true }
})
