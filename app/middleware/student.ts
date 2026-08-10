import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  const client = useSupabaseClient<Database>()
  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.value.sub)
    .single()

  if (error || !profile) {
    return navigateTo('/login')
  }

  if (canAccessAdmin(profile.role)) {
    return navigateTo('/admin', { replace: true })
  }
})
