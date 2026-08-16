import { describe, expect, it } from 'vitest'
import { signInSchema, signUpSchema } from '../../app/composables/useAuth'

describe('authentication validation', () => {
  it('accepts an existing short password when signing in', () => {
    expect(signInSchema.safeParse({ email: 'aluno@example.test', password: '102030' }).success).toBe(true)
  })

  it('rejects invalid or empty sign-in credentials', () => {
    expect(signInSchema.safeParse({ email: 'invalido', password: '102030' }).success).toBe(false)
    expect(signInSchema.safeParse({ email: 'aluno@example.test', password: '' }).success).toBe(false)
  })

  it('accepts a six-character password for new accounts', () => {
    const input = { name: 'Aluno', email: 'aluno@example.test', password: '102030' }
    expect(signUpSchema.safeParse(input).success).toBe(true)
  })
})
