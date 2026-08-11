import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'
import { courseSchema } from '../../../utils/course-validation'
import { saveCourse } from '../../../services/course.service'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const parsed = courseSchema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 422, statusMessage: parsed.error.issues.map(issue => issue.message).join('; '), data: parsed.error.flatten() }) }
  const { presential, ...course } = parsed.data
  const client = await serverSupabaseClient<Database>(event)
  return saveCourse(client, course, presential ? { ...presential, course_id: crypto.randomUUID() } : null)
})
