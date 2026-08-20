import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const userId = await resolveAuthenticatedUserId()
  if (!userId) {
    return
  }

  const client = useSupabaseClient<Database>()
  const { data: { user } } = await client.auth.getUser()
  if (user?.app_metadata.must_change_password === true) {
    return navigateTo('/primeiro-acesso')
  }

  const { data: profile } = await client.from('profiles').select('role').eq('id', userId).single()
  return navigateTo(getAuthenticatedHome(profile?.role), { replace: true })
})
