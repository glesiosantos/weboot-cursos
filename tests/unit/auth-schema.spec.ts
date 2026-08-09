import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migration = readFileSync(resolve('supabase/migrations/20260809000200_rls_and_storage.sql'), 'utf8')
const schema = readFileSync(resolve('supabase/migrations/20260809000100_initial_schema.sql'), 'utf8')

describe('authorization schema', () => {
  it.each(['profiles', 'orders', 'enrollments', 'lesson_progress', 'certificates', 'audit_logs'])(
    'enables RLS for %s through the mandatory table loop',
    (table) => {
      expect(migration).toContain(`'${table}'`)
      expect(migration).toContain('enable row level security')
      expect(migration).toContain('force row level security')
    },
  )

  it('isolates orders and enrollments by authenticated owner', () => {
    expect(migration).toContain('orders_select_own')
    expect(migration).toContain('enrollments_select_own')
    expect(migration.match(/user_id = \(select auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(5)
  })

  it('does not grant students mutation policies for payments or certificates', () => {
    expect(migration).not.toMatch(/create policy (?!admin_).*payments.*for (insert|update|delete)/i)
    expect(migration).not.toMatch(/create policy (?!admin_).*certificates.*for (insert|update|delete)/i)
  })

  it('protects role changes in the database', () => {
    expect(schema).toContain('protect_profile_role')
    expect(schema).toContain('raise exception \'role changes require administrator privileges\'')
  })

  it('requires an active enrollment for private materials', () => {
    expect(migration).toContain('e.status = \'ACTIVE\'')
    expect(migration).toContain('bucket_id in (\'course-materials\',\'course-videos\')')
  })
})
