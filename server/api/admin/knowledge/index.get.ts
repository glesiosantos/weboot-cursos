import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('knowledge_items')
    .select('*,knowledge_item_images(id,file_path,alt_text,position),course_knowledge_items(id,course_id)')
    .order('updated_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar a biblioteca' }) }
  return data ?? []
})
