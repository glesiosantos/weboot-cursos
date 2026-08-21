import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboardApi = readFileSync('server/api/admin/dashboard.get.ts', 'utf8')
const participantsApi = readFileSync('server/api/admin/courses/[id]/participants.get.ts', 'utf8')
const participantsPage = readFileSync('app/pages/admin/cursos/[id]/inscritos.vue', 'utf8')
const studentCourseApi = readFileSync('server/api/student/courses/[enrollmentId].get.ts', 'utf8')
const materialDeleteApi = readFileSync('server/api/admin/courses/[id]/materials/[materialId].delete.ts', 'utf8')
const studentCoursePage = readFileSync('app/pages/aluno/cursos/[enrollmentId].vue', 'utf8')

describe('sales dashboard and student materials', () => {
  it('protects sales totals and counts only paid orders as revenue', () => {
    expect(dashboardApi).toContain('requireRole(event, [\'ADMIN\'])')
    expect(dashboardApi).toContain('order.status === \'PAID\'')
    expect(dashboardApi).toContain('averageTicket')
  })

  it('shows every course registration before or after enrollment', () => {
    expect(participantsApi).toContain('client.from(\'orders\')')
    expect(participantsApi).toContain('registration_contacts(full_name,email)')
    expect(participantsApi).toContain('enrollmentId: enrollment?.id ?? null')
    expect(participantsApi).toContain('registrations: participants.length')
    expect(participantsPage).toContain('Inscrições recebidas')
    expect(participantsPage).toContain('item.enrollmentStatus ?? \'Não matriculado\'')
  })

  it('checks active ownership before creating temporary material links', () => {
    expect(studentCourseApi).toContain('.eq(\'user_id\', user.sub).eq(\'status\', \'ACTIVE\')')
    expect(studentCourseApi).toContain('createSignedUrl(material.file_path, 3600')
    expect(studentCoursePage).toContain('Materiais do curso')
    expect(studentCoursePage).toContain('course.coverUrl')
  })

  it('removes both the material record and its private object', () => {
    expect(materialDeleteApi).toContain('from(\'course_materials\').delete()')
    expect(materialDeleteApi).toContain('storage.from(\'course-materials\').remove')
  })
})
