import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const endpoint = readFileSync('server/api/admin/courses/[id]/participants/manual-enrollment.post.ts', 'utf8')
const page = readFileSync('app/pages/admin/cursos/[id]/inscritos.vue', 'utf8')
const migration = readFileSync('supabase/migrations/20260902000100_manual_enrollment_payment_provider.sql', 'utf8')

describe('manual enrollment', () => {
  it('is admin-only, confirms an existing receipt and uses the shared completion flow', () => {
    expect(endpoint).toContain('requireRole(event, [\'ADMIN\'])')
    expect(endpoint).toContain('payment_provider: \'MANUAL\'')
    expect(endpoint).toContain('Confirme-a pelo provedor original')
    expect(endpoint).toContain('\'CONFIRMED_MANUALLY\'')
    expect(endpoint).toContain('completeCommercialOrder')
    expect(endpoint).toContain('action: \'MANUAL_ENROLLMENT_PAYMENT_CONFIRMED\'')
  })

  it('requires matching value, payment evidence and customer authorization', () => {
    expect(endpoint).toContain('amount_received')
    expect(endpoint).toContain('payment_reference')
    expect(endpoint).toContain('customer_authorized')
    expect(page).toContain('Confirmar pagamento e matricular aluno')
  })

  it('allows manual payments in the database contract', () => {
    expect(migration).toContain('\'MANUAL\'')
  })
})
