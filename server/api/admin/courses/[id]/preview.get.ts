import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { getCoursePresentation } from '../../../../services/course-presentation.service'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const course = await getCoursePresentation(client, { id }, true)
  if (!course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  return course
})
