import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const userId = await resolveAuthenticatedUserId()
  if (!userId) { return navigateTo('/login') }
  const client = useSupabaseClient<Database>()
  const { data } = await client.from('profiles').select('role').eq('id', userId).single()
  if (!data || !['ADMIN', 'INSTRUCTOR'].includes(data.role)) { return navigateTo('/aluno') }
})
