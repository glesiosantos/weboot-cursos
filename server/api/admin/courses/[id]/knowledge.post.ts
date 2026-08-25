import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireCourseManager } from '../../../../utils/auth'

const schema = z.object({
  knowledgeItemId: z.uuid(), titleOverride: z.string().trim().max(160).nullable().optional(),
  isRequired: z.boolean().default(true), isPreEvent: z.boolean().default(true),
  availableAt: z.iso.datetime().nullable().optional(), dueAt: z.iso.datetime().nullable().optional(),
}).strict()

export default defineEventHandler(async (event) => {
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  await requireCourseManager(event, courseId)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 422, statusMessage: 'Configuração da atividade inválida' }) }
  if (body.data.availableAt && body.data.dueAt && body.data.dueAt < body.data.availableAt) {
    throw createError({ statusCode: 422, statusMessage: 'O prazo não pode ser anterior à liberação' })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: item } = await admin.from('knowledge_items').select('id,version,status').eq('id', body.data.knowledgeItemId).single()
  if (!item || item.status !== 'PUBLISHED') { throw createError({ statusCode: 422, statusMessage: 'Selecione um material publicado' }) }
  const { count } = await admin.from('course_knowledge_items').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
  const { data, error } = await admin.from('course_knowledge_items').insert({
    course_id: courseId, knowledge_item_id: item.id, title_override: body.data.titleOverride || null,
    position: count ?? 0, is_required: body.data.isRequired, is_pre_event: body.data.isPreEvent,
    available_at: body.data.availableAt || null, due_at: body.data.dueAt || null, knowledge_version: item.version,
  }).select().single()
  if (error) { throw createError({ statusCode: error.code === '23505' ? 409 : 400, statusMessage: error.code === '23505' ? 'Este material já está no curso' : error.message }) }
  return data
})
