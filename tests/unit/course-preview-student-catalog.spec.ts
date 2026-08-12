import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Course } from '../../app/types/course'
import { filterCourses } from '../../app/utils/course'

const source = (path: string) => readFileSync(resolve(path), 'utf8')
const previewApi = source('server/api/admin/courses/[id]/preview.get.ts')
const presentationService = source('server/services/course-presentation.service.ts')
const presentation = source('app/components/course/CoursePresentation.vue')
const publicPage = source('app/pages/cursos/[slug].vue')
const previewPage = source('app/pages/admin/cursos/[id]/preview.vue')
const studentCatalog = source('app/pages/aluno/catalogo.vue')
const studentMiddleware = source('app/middleware/student.ts')
const publishedCourses = source('app/composables/usePublishedCourses.ts')
const dashboard = source('app/pages/aluno/index.vue')
const sample = (overrides: Partial<Course> = {}): Course => ({ id: '1', title: 'Curso SQL', slug: 'curso-sql', short_description: 'Dados', course_type: 'ONLINE', workload_hours: 20, price: 199.9, promotional_price: null, cover_url: null, instructor_name: 'Instrutor', ...overrides })

describe('admin course preview', () => {
  it('allows ADMIN to fetch DRAFT without changing its status', () => {
    expect(previewApi).toContain('requireRole(event, [\'ADMIN\'])')
    expect(previewApi).toContain('getCoursePresentation(client, { id }, true)')
    expect(previewApi).not.toContain('update({ status: \'PUBLISHED\' })')
    expect(presentationService).toContain('if (!preview) { query = query.eq(\'status\', \'PUBLISHED\') }')
  })

  it('reuses the exact public presentation and disables commerce in preview', () => {
    expect(publicPage).toContain('import CoursePresentation from \'~/components/course/CoursePresentation.vue\'')
    expect(previewPage).toContain('import CoursePresentation from \'~/components/course/CoursePresentation.vue\'')
    expect(previewPage).toContain('mode="preview"')
    expect(presentation).toContain('Ações comerciais desativadas no preview')
    expect(presentationService).not.toMatch(/from\('(orders|enrollments)'\)/)
  })

  it('shows batches, folder, modules and responsive controls without exposing private video paths', () => {
    expect(presentation).toContain('course.current_batch')
    expect(presentation).toContain('course.folder_url')
    expect(presentation).toContain('course.modules')
    expect(presentationService).not.toContain('video_path')
    expect(previewPage).toContain('[\'desktop\', \'tablet\', \'mobile\']')
    expect(previewPage).toContain('robots: \'noindex, nofollow\'')
  })
})

describe('authenticated student catalog', () => {
  it('uses the published-course source and keeps DRAFT hidden by RLS/query', () => {
    expect(studentCatalog).toContain('usePublishedCourses()')
    expect(publishedCourses).toContain('.eq(\'status\', \'PUBLISHED\')')
    expect(publishedCourses).toContain('.is(\'archived_at\', null)')
    expect(studentCatalog).toContain('middleware: [\'auth\', \'student\']')
    expect(studentMiddleware).toContain('canAccessAdmin(profile.role)')
  })

  it('shares search and modality filtering for ONLINE and PRESENCIAL', () => {
    const courses = [sample(), sample({ id: '2', title: 'Curso Presencial', slug: 'presencial', course_type: 'PRESENCIAL' })]
    expect(filterCourses(courses, 'TODOS', 'sql')).toHaveLength(1)
    expect(filterCourses(courses, 'ONLINE', '')).toEqual([courses[0]])
    expect(filterCourses(courses, 'PRESENCIAL', '')).toEqual([courses[1]])
  })

  it('reuses fixed/batch public pricing and prepares ACTIVE enrollment state', () => {
    expect(publishedCourses).toContain('course.pricing_type === \'BATCHES\'')
    expect(publishedCourses).toContain('rpc(\'get_current_course_batch\'')
    expect(studentCatalog).toContain(':enrolled="enrolledCourseIds?.has(course.id)"')
    expect(studentCatalog).not.toMatch(/\b(mais vendidos|\u00faltimas vagas)\b/i)
  })

  it('limits the student dashboard to the three newest published courses', () => {
    expect(dashboard).toContain('(courses.value ?? []).slice(0, 3)')
    expect(dashboard).toContain('Explore novos cursos')
    expect(dashboard).toContain('Ver catálogo completo')
  })
})
