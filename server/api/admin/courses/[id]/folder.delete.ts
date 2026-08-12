import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error: courseError } = await client.from('courses').select('folder_path').eq('id', id).single()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { error: updateError } = await client.from('courses').update({ folder_path: null, folder_alt_text: null, folder_mime_type: null, folder_original_name: null, folder_updated_at: null }).eq('id', id)
  if (updateError) { throw createError({ statusCode: 400, statusMessage: updateError.message }) }
  let storageRemoved = true
  if (course.folder_path) {
    const { error: removeError } = await client.storage.from('course-public-assets').remove([course.folder_path])
    storageRemoved = !removeError
  }
  return { removed: true, storage_removed: storageRemoved }
})
