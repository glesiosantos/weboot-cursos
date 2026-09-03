import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCourseProgress } from '../../server/utils/course-progress'

describe('course consumption and progress', () => {
  it('calculates completion from required lessons and resumes the last accessed lesson', () => {
    const result = buildCourseProgress([
      { id: 'required-1', is_required: true },
      { id: 'optional', is_required: false },
      { id: 'required-2', is_required: true },
    ], [
      { lesson_id: 'required-1', started_at: '2026-09-03T10:00:00Z', completed_at: '2026-09-03T10:05:00Z', updated_at: '2026-09-03T10:05:00Z' },
      { lesson_id: 'optional', started_at: '2026-09-03T11:00:00Z', completed_at: null, updated_at: '2026-09-03T11:00:00Z' },
    ])
    expect(result).toMatchObject({ completed: 1, total: 2, percentage: 50, lastLessonId: 'optional' })
  })

  it('handles a course without lessons', () => {
    expect(buildCourseProgress([], [])).toMatchObject({ completed: 0, total: 0, percentage: 0, lastLessonId: null })
  })

  it('derives identity and course ownership on the server', () => {
    const endpoint = readFileSync(resolve('server/api/student/courses/[enrollmentId]/progress.put.ts'), 'utf8')
    expect(endpoint).toContain('.eq(\'user_id\', user.sub).eq(\'status\', \'ACTIVE\')')
    expect(endpoint).toContain('.eq(\'course_modules.course_id\', enrollment.course_id)')
    expect(endpoint).not.toMatch(/body\.userId|body\.courseId/)
  })

  it('enforces lesson and course consistency in the database', () => {
    const migration = readFileSync(resolve('supabase/migrations/20260903000100_harden_lesson_progress.sql'), 'utf8')
    expect(migration).toContain('validate_lesson_progress_course')
    expect(migration).toContain('module.course_id = new.course_id')
    expect(migration).toContain('enrollment.status = \'ACTIVE\'')
  })
})
