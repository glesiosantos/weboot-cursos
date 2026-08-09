import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
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
    .eq('id', user.id)
    .single()

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }
  return { user, role: profile.role }
}
