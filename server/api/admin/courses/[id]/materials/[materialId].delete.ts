import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const materialId = z.uuid().parse(getRouterParam(event, 'materialId'))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('course_materials').select('id,file_path').eq('id', materialId).eq('course_id', courseId).single()
  if (error || !data) { throw createError({ statusCode: 404, statusMessage: 'Material não encontrado' }) }
  const { error: deleteError } = await client.from('course_materials').delete().eq('id', materialId).eq('course_id', courseId)
  if (deleteError) { throw createError({ statusCode: 400, statusMessage: deleteError.message }) }
  const { error: storageError } = await client.storage.from('course-materials').remove([data.file_path])
  if (storageError) { throw createError({ statusCode: 500, statusMessage: 'Cadastro removido, mas o arquivo não pôde ser excluído' }) }
  return { deleted: true }
})
