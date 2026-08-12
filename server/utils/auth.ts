import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export type AppRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export const requireUser = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticação necessária' })
  }
  return user
}

export const requireRole = async (event: H3Event, allowedRoles: AppRole[]) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }
  return { user, role: profile.role }
}

export const requireCourseManager = async (event: H3Event, courseId: string) => {
  const auth = await requireRole(event, ['ADMIN', 'INSTRUCTOR'])
  if (auth.role === 'ADMIN') { return auth }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data } = await admin.from('courses').select('id,instructors!inner(profile_id)').eq('id', courseId).eq('instructors.profile_id', auth.user.sub).maybeSingle()
  if (!data) { throw createError({ statusCode: 403, statusMessage: 'Instrutor não autorizado para este evento' }) }
  return auth
}
