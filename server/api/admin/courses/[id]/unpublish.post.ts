import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.from('courses').update({ status: 'DRAFT' }).eq('id', id)
  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  return { ok: true }
})
