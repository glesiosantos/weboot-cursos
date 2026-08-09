export const getRecoveryRouteFromHash = (path: string, hash: string) => {
  if (path !== '/' || !hash) {
    return null
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.get('type') !== 'recovery') {
    return null
  }

  return {
    path: '/redefinir-senha',
    hash: hash.startsWith('#') ? hash : `#${hash}`,
  }
}
