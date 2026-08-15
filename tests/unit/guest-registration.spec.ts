import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { guestRegistrationSchema, isValidCpf, normalizeWhatsapp } from '../../server/utils/registration'

const migration = readFileSync('supabase/migrations/20260813000100_guest_registration.sql', 'utf8')
const endpoint = readFileSync('server/api/registrations/index.post.ts', 'utf8')
const webhook = readFileSync('server/api/webhooks/asaas.post.ts', 'utf8')
const provider = readFileSync('server/services/asaas-hosted-checkout.provider.ts', 'utf8')

const valid = { course_id: 'a174f612-35c6-45c0-bf07-a0047bb6fdd3', full_name: 'Maria da Silva', cpf: '529.982.247-25', whatsapp: '(86) 99999-9999', email: 'maria@example.com', terms_accepted: true, marketing_accepted: false }

describe('guest registration', () => {
  it('validates and normalizes personal data on the server', () => {
    expect(isValidCpf(valid.cpf)).toBe(true)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(normalizeWhatsapp(valid.whatsapp)).toBe('+5586999999999')
    expect(guestRegistrationSchema.safeParse(valid).success).toBe(true)
    expect(guestRegistrationSchema.safeParse({ ...valid, email: 'invalid' }).success).toBe(false)
    expect(guestRegistrationSchema.safeParse({ ...valid, terms_accepted: false }).success).toBe(false)
  })

  it('accepts customer names from 6 to 150 characters', () => {
    expect(guestRegistrationSchema.safeParse({ ...valid, full_name: 'a'.repeat(5) }).success).toBe(false)
    expect(guestRegistrationSchema.safeParse({ ...valid, full_name: 'a'.repeat(6) }).success).toBe(true)
    expect(guestRegistrationSchema.safeParse({ ...valid, full_name: 'a'.repeat(150) }).success).toBe(true)
    expect(guestRegistrationSchema.safeParse({ ...valid, full_name: 'a'.repeat(151) }).success).toBe(false)
  })

  it('keeps CPF protected and guest orders traceable without an auth user', () => {
    expect(migration).toContain('cpf_encrypted text not null')
    expect(migration).toContain('cpf_hash text not null')
    expect(migration).toContain('alter table public.orders alter column user_id drop not null')
    expect(migration).toContain('registration_id uuid unique')
    expect(endpoint).toContain('protectRegistration(parsed.data.cpf')
    expect(endpoint).not.toMatch(/console\.(log|info|debug).*cpf/i)
  })

  it('gets price, batch and capacity from the transactional database function', () => {
    expect(endpoint).not.toMatch(/body\.(price|batch|total)|parsed\.data\.(price|batch|total)/)
    expect(migration).toContain('get_current_course_batch(target_course_id, now())')
    expect(migration).toContain('raise exception \'course sold out\'')
    expect(migration).toContain('raise exception \'course batch sold out\'')
  })

  it('lets the hosted Asaas checkout collect the complete payer address', () => {
    expect(provider).not.toContain('customerData:')
    expect(provider).not.toContain('cpfCnpj:')
  })

  it('does not require an email confirmation field', () => {
    expect(guestRegistrationSchema.safeParse({ ...valid, email_confirmation: valid.email }).success).toBe(false)
  })

  it('creates enrollment only through the shared confirmation service', () => {
    expect(webhook).toContain('completeCommercialOrder')
    expect(endpoint).toContain('Number(order.unit_price) === 0')
    expect(migration).toContain('if target_order.user_id is null then raise exception \'order user not associated\'')
    expect(migration).toContain('on conflict (user_id, course_id) do update')
  })

  it('uses an opaque public reference and never CPF in a public lookup', () => {
    expect(endpoint).toContain('randomBytes(24).toString(\'base64url\')')
    expect(migration).toContain('public_reference_hash text not null unique')
    expect(migration).not.toMatch(/get_registration_status[\s\S]*cpf_encrypted/)
  })
})
