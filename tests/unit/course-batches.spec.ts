import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { courseBatchSchema, courseSchema } from '../../server/utils/course-validation'

const migration = [
  'supabase/migrations/20260811000300_course_batches.sql',
  'supabase/migrations/20260811000400_harden_course_batches.sql',
].map(path => readFileSync(resolve(path), 'utf8')).join('\n')
const baseCourse = {
  title: 'Curso', slug: 'curso', short_description: 'Resumo', description: 'Descrição', course_type: 'ONLINE',
  instructor_id: '10000000-0000-4000-8000-000000000001', workload_hours: 10, price: 100, status: 'DRAFT',
}
const activeBatch = { name: '1º lote', position: 1, price: 99.9, max_sales: 10, activation_mode: 'QUANTITY', status: 'ACTIVE' }

describe('course batches', () => {
  it('allows FIXED courses without batches and requires batches for BATCHES courses', () => {
    expect(courseSchema.safeParse({ ...baseCourse, pricing_type: 'FIXED', batches: [] }).success).toBe(true)
    expect(courseSchema.safeParse({ ...baseCourse, pricing_type: 'BATCHES', batches: [] }).success).toBe(false)
  })

  it('rejects negative prices, zero max_sales, reversed dates and duplicate positions', () => {
    expect(courseBatchSchema.safeParse({ ...activeBatch, price: -1 }).success).toBe(false)
    expect(courseBatchSchema.safeParse({ ...activeBatch, max_sales: 0 }).success).toBe(false)
    expect(courseBatchSchema.safeParse({ ...activeBatch, max_sales: undefined }).success).toBe(false)
    expect(courseBatchSchema.safeParse({ ...activeBatch, activation_mode: 'DATE', starts_at: '2026-09-10T00:00:00.000Z', ends_at: '2026-09-01T00:00:00.000Z' }).success).toBe(false)
    expect(courseSchema.safeParse({ ...baseCourse, pricing_type: 'BATCHES', batches: [activeBatch, { ...activeBatch, name: '2º lote' }] }).success).toBe(false)
    expect(migration).toContain('check (max_sales is not null) not valid')
  })

  it('does not accept an expired batch as the publication requirement', () => {
    expect(courseSchema.safeParse({
      ...baseCourse, status: 'PUBLISHED', pricing_type: 'BATCHES',
      batches: [{ ...activeBatch, activation_mode: 'DATE', status: 'SCHEDULED', starts_at: '2020-01-01T00:00:00.000Z', ends_at: '2020-01-02T00:00:00.000Z' }],
    }).success).toBe(false)
  })

  it('keeps draft and expired batches out of public reads and selects only the current time window', () => {
    expect(migration).toContain('course_batches.status in (\'ACTIVE\', \'SCHEDULED\')')
    expect(migration).toContain('course_batches.starts_at <= now()')
    expect(migration).toContain('course_batches.ends_at > now()')
    expect(migration).not.toMatch(/course_batches\.status in \([^)]*DRAFT/)
    expect(migration).toContain('b.starts_at is null or b.starts_at <= reference_at')
    expect(migration).toContain('b.ends_at is null or b.ends_at > reference_at')
    expect(migration).toContain('b.starts_at > reference_at')
    expect(migration).toContain('order by b.position')
  })

  it('allows only admins to replace batches and preserves student read-only access', () => {
    expect(migration).toContain('create policy public_course_batches_read on public.course_batches for select to anon, authenticated')
    expect(migration).toContain('create policy admin_all_course_batches on public.course_batches for all to authenticated')
    expect(migration).toContain('if not public.is_admin() then raise exception \'administrator privileges required\'')
    expect(migration).toContain('grant execute on function public.replace_course_batches(uuid, jsonb) to authenticated')
    expect(migration).not.toMatch(/create policy [^\n]+course_batches[^\n]+for (insert|update|delete)/i)
  })

  it('allows online batches and rejects clearly excessive presential capacity', () => {
    expect(courseSchema.safeParse({ ...baseCourse, pricing_type: 'BATCHES', batches: [activeBatch] }).success).toBe(true)
    expect(courseSchema.safeParse({
      ...baseCourse, course_type: 'PRESENCIAL', pricing_type: 'BATCHES', batches: [activeBatch],
      presential: { location_name: 'WeBoot', city: 'São Paulo', state: 'SP', starts_at: '2099-09-01T10:00:00.000Z', ends_at: '2099-09-01T18:00:00.000Z', max_students: 5 },
    }).success).toBe(false)
  })
})
