import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('coupons').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar os vouchers deste curso' }) }
  return data
})
