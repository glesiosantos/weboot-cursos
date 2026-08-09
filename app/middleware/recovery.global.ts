import { getRecoveryRouteFromHash } from '~/utils/recovery-redirect'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return
  }

  const recoveryRoute = getRecoveryRouteFromHash(to.path, to.hash || window.location.hash)
  if (recoveryRoute) {
    return navigateTo(recoveryRoute, { replace: true })
  }
})
