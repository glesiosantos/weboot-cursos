import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireCourseManager } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const assignmentId = z.uuid().parse(getRouterParam(event, 'assignmentId'))
  await requireCourseManager(event, courseId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { error } = await admin.from('course_knowledge_items').delete().eq('id', assignmentId).eq('course_id', courseId)
  if (error) { throw createError({ statusCode: 400, statusMessage: 'Não foi possível remover a atividade do curso' }) }
  return { removed: true }
})
