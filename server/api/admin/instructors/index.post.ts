import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'
import { instructorSchema } from '../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const values = instructorSchema.parse(await readBody(event))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('instructors').insert(values).select().single()
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  return data
})
