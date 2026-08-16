import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { materialUploadSchema } from '../../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')
  const title = parts?.find(part => part.name === 'title')?.data.toString().trim()
  if (!file?.data || !file.type || !title) { throw createError({ statusCode: 422, statusMessage: 'Título e arquivo são obrigatórios' }) }
  const parsed = materialUploadSchema.safeParse({ type: file.type, size: file.data.byteLength })
  if (!parsed.success) { throw createError({ statusCode: 415, statusMessage: 'Arquivo inválido ou maior que 50 MB' }) }
  const extension: Record<string, string> = { 'application/pdf': 'pdf', 'application/zip': 'zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx' }
  const path = `courses/${courseId}/${crypto.randomUUID()}.${extension[parsed.data.type]}`
  const client = await serverSupabaseClient<Database>(event)
  const { error: uploadError } = await client.storage.from('course-materials').upload(path, file.data, { contentType: parsed.data.type })
  if (uploadError) { throw createError({ statusCode: 400, statusMessage: uploadError.message }) }
  const { data, error } = await client.from('course_materials').insert({ course_id: courseId, module_id: null, lesson_id: null, title, file_path: path, mime_type: parsed.data.type, file_size: file.data.byteLength }).select().single()
  if (error) { await client.storage.from('course-materials').remove([path]); throw createError({ statusCode: 400, statusMessage: error.message }) }
  return data
})
