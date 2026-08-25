import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireRole } from '../../../utils/auth'
import { knowledgeStatusSchema } from '../../../utils/knowledge'

const schema = z.object({
  title: z.string().trim().min(3).max(160), summary: z.string().trim().max(1000).nullable().optional(),
  content: z.string().trim().min(1).nullable().optional(), status: knowledgeStatusSchema,
}).strict()

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = z.uuid().parse(getRouterParam(event, 'id'))
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 422, statusMessage: 'Dados do material inválidos' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: current } = await admin.from('knowledge_items').select('content_type,version').eq('id', id).single()
  if (!current) { throw createError({ statusCode: 404, statusMessage: 'Material não encontrado' }) }
  if (current.content_type === 'POST' && !body.data.content) { throw createError({ statusCode: 422, statusMessage: 'O conteúdo do post é obrigatório' }) }
  const nextVersion = current.version + 1
  const { data, error } = await admin.from('knowledge_items').update({ ...body.data, version: nextVersion }).eq('id', id).select().single()
  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
  const { error: assignmentError } = await admin.from('course_knowledge_items').update({ knowledge_version: nextVersion }).eq('knowledge_item_id', id)
  if (assignmentError) { throw createError({ statusCode: 500, statusMessage: 'O material foi atualizado, mas os cursos vinculados precisam ser revisados' }) }
  return data
})
