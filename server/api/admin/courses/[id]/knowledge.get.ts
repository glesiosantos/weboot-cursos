import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireCourseManager } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  await requireCourseManager(event, courseId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const [{ data: assigned, error }, { data: library }] = await Promise.all([
    admin.from('course_knowledge_items').select('*,knowledge_items(id,title,summary,content_type,status,version)').eq('course_id', courseId).order('position'),
    admin.from('knowledge_items').select('id,title,summary,content_type,status,version').eq('status', 'PUBLISHED').order('title'),
  ])
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar a preparação do curso' }) }
  return { assigned: assigned ?? [], library: library ?? [] }
})
