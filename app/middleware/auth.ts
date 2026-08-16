export default defineNuxtRouteMiddleware(async (to) => {
  if (!await resolveAuthenticatedUserId()) {
    return navigateTo('/login')
  }
  const client = useSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (user?.app_metadata.must_change_password === true && to.path !== '/primeiro-acesso') {
    return navigateTo('/primeiro-acesso')
  }
})
