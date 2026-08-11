import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve('supabase/migrations/20260811000100_course_catalog.sql'), 'utf8')
describe('course catalog security contracts', () => {
  it('keeps private learning buckets private', () => { expect(migration).toContain('where id in (\'course-materials\', \'course-videos\')'); expect(migration).toContain('drop policy if exists enrolled_materials_read') })
  it('exposes only lesson metadata publicly', () => { expect(migration).toContain('published_lesson_metadata'); expect(migration).not.toMatch(/published_lesson_metadata[\s\S]{0,300}video_path/) })
  it('allows admin writes through existing admin policies', () => { expect(migration).toContain('admin_all_course_presential_details'); expect(migration).toContain('public.is_admin()') })
  it('enforces online modules and publication completeness', () => { expect(migration).toContain('ensure_online_module'); expect(migration).toContain('online course requires at least one lesson') })
})
