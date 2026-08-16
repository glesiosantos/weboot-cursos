import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { coverUploadSchema, hasValidFolderSignature } from '../../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')
  if (!file?.data || !file.type) { throw createError({ statusCode: 422, statusMessage: 'Selecione uma imagem' }) }
  const parsed = coverUploadSchema.safeParse({ type: file.type, size: file.data.byteLength })
  if (!parsed.success) { throw createError({ statusCode: 415, statusMessage: 'Use JPEG, PNG ou WEBP de até 5 MB' }) }
  if (!hasValidFolderSignature(parsed.data.type, file.data)) { throw createError({ statusCode: 415, statusMessage: 'O conteúdo do arquivo não corresponde a uma imagem válida' }) }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[parsed.data.type]
  const path = `courses/${id}/${crypto.randomUUID()}.${extension}`
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error: courseError } = await client.from('courses').select('cover_path').eq('id', id).single()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { error: uploadError } = await client.storage.from('course-covers').upload(path, file.data, { contentType: parsed.data.type })
  if (uploadError) { throw createError({ statusCode: 400, statusMessage: uploadError.message }) }
  const { error } = await client.from('courses').update({ cover_path: path }).eq('id', id)
  if (error) { await client.storage.from('course-covers').remove([path]); throw createError({ statusCode: 400, statusMessage: error.message }) }
  if (course.cover_path && course.cover_path !== path) { await client.storage.from('course-covers').remove([course.cover_path]) }
  return { path }
})
