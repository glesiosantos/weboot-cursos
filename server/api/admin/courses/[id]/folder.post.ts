import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { folderUploadSchema, hasValidFolderSignature } from '../../../../utils/course-validation'

const extensionByMime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' } as const

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file')
  if (!file?.data || !file.type || !file.filename) { throw createError({ statusCode: 422, statusMessage: 'Selecione um folder' }) }
  const parsed = folderUploadSchema.safeParse({ type: file.type, size: file.data.byteLength, filename: file.filename })
  if (!parsed.success || !hasValidFolderSignature(file.type, file.data)) { throw createError({ statusCode: 415, statusMessage: 'Use JPEG, PNG ou WEBP de até 10 MB, ou PDF de até 15 MB' }) }
  const altPart = parts?.find(part => part.name === 'alt_text')
  const altText = altPart?.data.toString('utf8').trim().slice(0, 240) || null
  const extension = extensionByMime[parsed.data.type]
  const path = `courses/${id}/folder/${crypto.randomUUID()}.${extension}`
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error: courseError } = await client.from('courses').select('folder_path').eq('id', id).single()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { error: uploadError } = await client.storage.from('course-public-assets').upload(path, file.data, { contentType: parsed.data.type, upsert: false })
  if (uploadError) { throw createError({ statusCode: 400, statusMessage: uploadError.message }) }
  const { error: updateError } = await client.from('courses').update({ folder_path: path, folder_alt_text: altText, folder_mime_type: parsed.data.type, folder_original_name: parsed.data.filename, folder_updated_at: new Date().toISOString() }).eq('id', id)
  if (updateError) {
    await client.storage.from('course-public-assets').remove([path])
    throw createError({ statusCode: 400, statusMessage: updateError.message })
  }
  if (course.folder_path && course.folder_path !== path) { await client.storage.from('course-public-assets').remove([course.folder_path]) }
  return { path, mime_type: parsed.data.type, original_name: parsed.data.filename, alt_text: altText }
})
