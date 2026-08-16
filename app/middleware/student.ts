import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const userId = await resolveAuthenticatedUserId()
  if (!userId) {
    return navigateTo('/login')
  }

  const client = useSupabaseClient<Database>()
  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return navigateTo('/login')
  }

  if (canAccessAdmin(profile.role)) {
    return navigateTo('/admin', { replace: true })
  }
})
