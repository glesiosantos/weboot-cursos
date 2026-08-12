import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export const safeStoragePath = (courseId: string, extension: string) => `courses/${courseId}/${crypto.randomUUID()}.${extension}`
export const uploadPrivateMaterial = async (client: SupabaseClient<Database>, courseId: string, file: File) => {
  const extensionByMime: Record<string, string> = {
    'application/pdf': 'pdf', 'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  }
  const extension = extensionByMime[file.type]
  if (!extension) { throw createError({ statusCode: 415, statusMessage: 'Tipo de arquivo não permitido' }) }
  const path = safeStoragePath(courseId, extension)
  const { error } = await client.storage.from('course-materials').upload(path, file, { contentType: file.type, upsert: false })
  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  return path
}
