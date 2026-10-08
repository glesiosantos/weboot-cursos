import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const active = z.boolean().parse((await readBody(event)).active)
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.from('coupons').update({ active }).eq('id', id)
  if (error) { throw createError({ statusCode: 400, statusMessage: 'Não foi possível alterar o voucher' }) }
  return { ok: true }
})
