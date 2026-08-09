import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const credentials = z.object({ email: z.email(), password: z.string().min(8) })

describe('authentication validation', () => {
  it('accepts valid credentials', () => {
    expect(credentials.safeParse({ email: 'aluno@example.test', password: 'senha-segura' }).success).toBe(true)
  })

  it.each([
    { email: 'invalido', password: 'senha-segura' },
    { email: 'aluno@example.test', password: 'curta' },
  ])('rejects invalid credentials', (input) => {
    expect(credentials.safeParse(input).success).toBe(false)
  })
})
