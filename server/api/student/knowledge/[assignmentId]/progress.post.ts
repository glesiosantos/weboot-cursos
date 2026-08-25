import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../../utils/auth'

const schema = z.object({ enrollmentId: z.uuid(), completed: z.boolean().default(false) }).strict()
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const assignmentId = z.uuid().parse(getRouterParam(event, 'assignmentId'))
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 422, statusMessage: 'Progresso inválido' }) }
  const client = await serverSupabaseClient<Database>(event)
  // RPC is introduced by the knowledge migration; generated types are updated after applying it remotely.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client as any).rpc('register_knowledge_progress', {
    target_enrollment_id: body.data.enrollmentId, target_course_knowledge_item_id: assignmentId, mark_completed: body.data.completed,
  })
  if (error) { throw createError({ statusCode: error.message.includes('access denied') ? 403 : 400, statusMessage: 'Não foi possível registrar a atividade' }) }
  return data
})
