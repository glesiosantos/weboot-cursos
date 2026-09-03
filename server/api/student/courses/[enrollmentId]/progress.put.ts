import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireUser } from '../../../../utils/auth'

const schema = z.object({ lessonId: z.uuid(), action: z.enum(['START', 'COMPLETE', 'UNCOMPLETE']) })

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const enrollmentId = z.uuid().parse(getRouterParam(event, 'enrollmentId'))
  const body = schema.parse(await readBody(event))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: enrollment, error: enrollmentError } = await admin.from('enrollments')
    .select('course_id').eq('id', enrollmentId).eq('user_id', user.sub).eq('status', 'ACTIVE').single()
  if (enrollmentError || !enrollment) { throw createError({ statusCode: 404, statusMessage: 'Matrícula ativa não encontrada' }) }
  const { data: lesson, error: lessonError } = await admin.from('lessons').select('id,course_modules!inner(course_id)')
    .eq('id', body.lessonId).eq('course_modules.course_id', enrollment.course_id).single()
  if (lessonError || !lesson) { throw createError({ statusCode: 404, statusMessage: 'Aula não encontrada neste curso' }) }
  const { data: current } = await admin.from('lesson_progress').select('completed_at')
    .eq('user_id', user.sub).eq('lesson_id', body.lessonId).maybeSingle()
  const now = new Date().toISOString()
  const values: Record<string, string | null> = { user_id: user.sub, course_id: enrollment.course_id, lesson_id: body.lessonId, started_at: now, completed_at: current?.completed_at ?? null }
  if (body.action === 'COMPLETE') { values.completed_at = now }
  if (body.action === 'UNCOMPLETE') { values.completed_at = null }
  const { data, error } = await admin.from('lesson_progress').upsert(values, { onConflict: 'user_id,lesson_id' })
    .select('lesson_id,started_at,completed_at,updated_at').single()
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível salvar o progresso' }) }
  return data
})
