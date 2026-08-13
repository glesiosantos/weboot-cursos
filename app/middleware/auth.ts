export default defineNuxtRouteMiddleware(async () => {
  if (!await resolveAuthenticatedUserId()) {
    return navigateTo('/login')
  }
})
