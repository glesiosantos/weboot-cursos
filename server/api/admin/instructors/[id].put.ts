import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../utils/auth'
import { instructorSchema } from '../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const values = instructorSchema.parse(await readBody(event))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('instructors').update(values).eq('id', id).select().single()
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  return data
})
