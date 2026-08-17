import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { canAccessAdmin } from '../../app/utils/authorization'

describe('phase 1 foundation', () => {
  it('allows only administrators into admin routes', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true)
    expect(canAccessAdmin('STUDENT')).toBe(false)
    expect(canAccessAdmin('INSTRUCTOR')).toBe(false)
  })

  it('queries only published, non-archived courses', () => {
    const source = readFileSync(resolve('app/composables/usePublishedCourses.ts'), 'utf8')
    expect(source).toContain('.eq(\'status\', \'PUBLISHED\')')
    expect(source).toContain('.is(\'archived_at\', null)')
    expect(source).not.toMatch(/catch\s*\{[^}]*return\s*\[\]/s)
  })

  it('keeps the public home lightweight and free from private course content', () => {
    const home = readFileSync(resolve('app/pages/index.vue'), 'utf8')
    const source = readFileSync(resolve('app/composables/usePublishedCourses.ts'), 'utf8')
    expect(home).toContain('.slice(0, 3)')
    expect(source).not.toMatch(/select\([^)]*(video_path|materials|address_number|postal_code)/)
  })

  it('keeps draft seed data out through RLS', () => {
    const seed = readFileSync(resolve('supabase/seed.sql'), 'utf8')
    const policies = readFileSync(resolve('supabase/migrations/20260809000300_foundation_hardening.sql'), 'utf8')
    expect(seed).toContain('\'DRAFT\'')
    expect(policies).toContain('status = \'PUBLISHED\'')
  })

  it('configures and validates the Supabase environment', () => {
    const config = readFileSync(resolve('nuxt.config.ts'), 'utf8')
    const env = readFileSync(resolve('server/plugins/env.ts'), 'utf8')
    expect(config).toContain('\'@nuxtjs/supabase\'')
    expect(env).toContain('NUXT_PUBLIC_SUPABASE_URL')
    expect(env).toContain('NUXT_PUBLIC_SUPABASE_KEY')
    expect(env).toContain('service role do Supabase nunca pode ser exposta')
  })
})
