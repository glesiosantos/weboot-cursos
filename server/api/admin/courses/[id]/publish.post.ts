import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'
import { publicationIssues } from '../../../../services/course.service'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const issues = await publicationIssues(client, id)
  if (issues.length) { throw createError({ statusCode: 422, statusMessage: `Campos pendentes: ${issues.join(', ')}`, data: { issues } }) }
  const { data, error } = await client.from('courses').update({ status: 'PUBLISHED' }).eq('id', id).select().single()
  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  return data
})
