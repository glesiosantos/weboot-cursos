import { describe, expect, it } from 'vitest'
import { getRecoveryRouteFromHash } from '../../app/utils/recovery-redirect'

describe('recovery redirect', () => {
  it('moves a recovery fragment from the home page to the password form', () => {
    const hash = '#access_token=secret&refresh_token=secret&type=recovery'

    expect(getRecoveryRouteFromHash('/', hash)).toEqual({
      path: '/redefinir-senha',
      hash,
    })
  })

  it('ignores normal home page fragments and other routes', () => {
    expect(getRecoveryRouteFromHash('/', '#section=courses')).toBeNull()
    expect(getRecoveryRouteFromHash('/login', '#type=recovery')).toBeNull()
  })
})
