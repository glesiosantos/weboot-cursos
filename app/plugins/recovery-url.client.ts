import { getRecoveryRouteFromHash } from '~/utils/recovery-redirect'

export default defineNuxtPlugin({
  name: 'recovery-url',
  order: -50,
  async setup() {
    const recoveryRoute = getRecoveryRouteFromHash(window.location.pathname, window.location.hash)
    if (recoveryRoute) {
      await navigateTo(recoveryRoute, { replace: true })
    }
  },
})
