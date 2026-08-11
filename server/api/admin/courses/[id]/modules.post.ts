import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { moduleSchema } from '../../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const values = moduleSchema.parse(await readBody(event))
  const client = await serverSupabaseClient<Database>(event)
  const { data: last } = await client.from('course_modules').select('position').eq('course_id', courseId).order('position', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await client.from('course_modules').insert({ ...values, course_id: courseId, position: (last?.position ?? -1) + 1 }).select().single()
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  return data
})
