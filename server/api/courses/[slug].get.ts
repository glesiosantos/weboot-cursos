import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { getCoursePresentation } from '../../services/course-presentation.service'
import { slugSchema } from '../../utils/course-validation'

export default defineEventHandler(async (event) => {
  const parsed = slugSchema.safeParse(getRouterParam(event, 'slug'))
  if (!parsed.success) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const client = await serverSupabaseClient<Database>(event)
  const course = await getCoursePresentation(client, { slug: parsed.data })
  if (!course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  return course
})
