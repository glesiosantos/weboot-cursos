import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { lessonSchema } from '../../../../utils/course-validation'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const moduleId = z.uuid().parse(getRouterParam(event, 'id'))
  const values = lessonSchema.parse(await readBody(event))
  const client = await serverSupabaseClient<Database>(event)
  const { data: last } = await client.from('lessons').select('position').eq('module_id', moduleId).order('position', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await client.from('lessons').insert({ ...values, module_id: moduleId, position: (last?.position ?? -1) + 1 }).select().single()
  if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  return data
})
