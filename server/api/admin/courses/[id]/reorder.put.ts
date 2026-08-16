import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

const schema = z.object({ type: z.enum(['module', 'lesson']), ids: z.array(z.uuid()).min(1), parent_id: z.uuid() })
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  z.uuid().parse(getRouterParam(event, 'id'))
  const values = schema.parse(await readBody(event))
  const client = await serverSupabaseClient<Database>(event)
  // Desloca temporariamente para preservar a constraint unique durante a troca.
  for (let position = 0; position < values.ids.length; position++) {
    const query = values.type === 'module'
      ? client.from('course_modules').update({ position: position + 100000 }).eq('id', values.ids[position]!).eq('course_id', values.parent_id)
      : client.from('lessons').update({ position: position + 100000 }).eq('id', values.ids[position]!).eq('module_id', values.parent_id)
    const { error } = await query
    if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  }
  for (let position = 0; position < values.ids.length; position++) {
    const query = values.type === 'module'
      ? client.from('course_modules').update({ position }).eq('id', values.ids[position]!).eq('course_id', values.parent_id)
      : client.from('lessons').update({ position }).eq('id', values.ids[position]!).eq('module_id', values.parent_id)
    const { error } = await query
    if (error) { throw createError({ statusCode: 422, statusMessage: error.message }) }
  }
  return { ok: true }
})
