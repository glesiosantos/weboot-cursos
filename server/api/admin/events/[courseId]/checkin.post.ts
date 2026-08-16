import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../utils/auth'
import { normalizeCredentialToken, sha256 } from '../../../../utils/commercial'

const schema = z.object({ token: z.string().trim().min(16).max(255), manual: z.boolean().optional().default(false) }).strict()
export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'courseId')!
  const { user } = await requireCourseManager(event, courseId)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 400, statusMessage: 'Token inválido' }) }
  const token = normalizeCredentialToken(body.data.token)
  if (!token) { return { result: 'INVALID' } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.rpc('check_in_event', {
    target_course_id: courseId, target_token_hash: sha256(token), actor_user_id: user.sub, manual_checkin: body.data.manual,
  })
  if (error) { throw createError({ statusCode: error.message.includes('access denied') ? 403 : 500, statusMessage: 'Não foi possível validar a credencial' }) }
  return data?.[0] ?? { result: 'INVALID' }
})
