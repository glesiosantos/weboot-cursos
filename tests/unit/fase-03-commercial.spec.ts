import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260812000200_commercial_checkout_and_event_access.sql', 'utf8')
const checkout = readFileSync('server/api/checkout.post.ts', 'utf8')
const provider = readFileSync('server/services/asaas-hosted-checkout.provider.ts', 'utf8')
const webhook = readFileSync('server/api/webhooks/asaas.post.ts', 'utf8')
const completion = readFileSync('server/services/complete-order.service.ts', 'utf8')
const checkin = readFileSync('server/api/admin/events/[courseId]/checkin.post.ts', 'utf8')
const checkoutFunctionFix = readFileSync('supabase/migrations/20260813000200_fix_checkout_function_ambiguity.sql', 'utf8')

describe('Fase 03 commercial contract', () => {
  it('takes fixed and batch prices only inside the database transaction', () => {
    expect(migration).toContain('selected_course.pricing_type = \'BATCHES\'')
    expect(migration).toContain('get_current_course_batch(target_course_id, now())')
    expect(migration).toContain('selected_course.promotional_price')
    expect(checkout).toContain('z.object({ course_id: z.uuid() }).strict()')
    expect(checkout).not.toMatch(/body\.data\.(price|total|unit_price)/)
  })

  it('locks capacity and counts confirmed plus non-expired reservations', () => {
    expect(migration).toContain('where id = target_course_id for update')
    expect(migration).toContain('r.status = \'CONFIRMED\'')
    expect(migration).toContain('r.status = \'RESERVED\' and r.expires_at > now()')
    expect(migration).toContain('occupied >= selected_batch.max_sales')
    expect(migration).toContain('occupied >= course_capacity')
  })

  it('reuses a valid waiting checkout and expires stale reservations', () => {
    expect(migration).toContain('o.status = \'WAITING_PAYMENT\' and o.expires_at > now()')
    expect(migration).toContain('set status = \'EXPIRED\'')
    expect(checkout).toContain('reused: true')
    expect(migration).toContain('orders_one_active_checkout_idx')
    expect(migration).toContain('exception when unique_violation')
  })

  it('resolves output-column ambiguity in both checkout functions', () => {
    expect(checkoutFunctionFix).toContain('prepare_checkout_order(uuid,uuid,integer)')
    expect(checkoutFunctionFix).toContain('prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer)')
    expect(checkoutFunctionFix).toContain('#variable_conflict use_column')
  })

  it('uses only hosted Asaas Sandbox checkout', () => {
    expect(provider).toContain('api-sandbox.asaas.com')
    expect(provider).toContain('/checkouts')
    expect(provider).toContain('chargeTypes: [\'DETACHED\']')
    expect(provider).toContain('billingTypes: [\'PIX\', \'CREDIT_CARD\']')
    expect(provider).toContain('https://asaas.com/checkoutSession/show?id=')
    expect(provider).not.toMatch(/cardNumber|creditCard|cvv|securityCode/i)
  })

  it('authenticates and deduplicates webhooks before idempotent effects', () => {
    expect(webhook).toContain('getHeader(event, \'asaas-access-token\')')
    expect(webhook).toContain('eventError?.code === \'23505\'')
    expect(webhook).toContain('existing?.status === \'PROCESSED\'')
    expect(webhook).toContain('\'CHECKOUT_PAID\'')
    expect(migration).toContain('on conflict (user_id, course_id) do update')
    expect(migration).toContain('on conflict (enrollment_id) do nothing')
  })

  it('hashes opaque credentials and atomically blocks double check-in', () => {
    expect(completion).toContain('credential_token_hash: sha256(credential.token)')
    expect(checkin).toContain('target_token_hash: sha256')
    expect(migration).toContain('for update')
    expect(migration).toContain('credential.status = \'USED\'')
    expect(migration).toContain('\'ALREADY_USED\'::text')
    expect(migration).toContain('actor_role not in (\'ADMIN\', \'INSTRUCTOR\')')
    expect(migration).toContain('\'manual_checkin\'')
  })

  it('cancels enrollment and credential after refund', () => {
    expect(migration).toContain('new_status = \'REFUNDED\'')
    expect(migration).toContain('update public.enrollments set status = \'CANCELED\'')
    expect(migration).toContain('update public.event_credentials c set status = \'CANCELED\'')
  })
})
