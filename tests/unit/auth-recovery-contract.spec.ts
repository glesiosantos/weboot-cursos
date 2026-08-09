import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Supabase recovery contract', () => {
  it('sends the dynamic recovery redirect to resetPasswordForEmail', () => {
    const source = readFileSync(resolve('app/composables/useAuth.ts'), 'utf8')
    expect(source).toContain('window.location.origin')
    expect(source).toContain('resetPasswordForEmail(parsedEmail, {')
    expect(source).toContain('redirectTo: getPasswordRecoveryRedirect(origin)')
  })

  it('keeps all authentication entry routes public', () => {
    const config = readFileSync(resolve('nuxt.config.ts'), 'utf8')
    for (const route of ['/login', '/esqueci-minha-senha', '/redefinir-senha']) {
      expect(config).toContain(`'${route}'`)
    }
  })

  it('updates only the password for the current recovery session', () => {
    const source = readFileSync(resolve('app/composables/useAuth.ts'), 'utf8')
    expect(source).toContain('client.auth.updateUser({ password,')
    expect(source).not.toContain('user_id')
    expect(source).not.toContain('auth.users')
  })
})
