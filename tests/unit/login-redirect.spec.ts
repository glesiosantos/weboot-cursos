import { describe, expect, it } from 'vitest'
import { getAuthenticatedHome } from '../../app/utils/authorization'

describe('post-login redirect', () => {
  it('sends administrators to the administrative dashboard', () => {
    expect(getAuthenticatedHome('ADMIN')).toBe('/admin')
  })

  it.each(['STUDENT', 'INSTRUCTOR', null] as const)('sends %s to the student area', (role) => {
    expect(getAuthenticatedHome(role)).toBe('/aluno')
  })
})
