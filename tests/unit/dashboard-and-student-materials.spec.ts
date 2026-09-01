import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboardApi = readFileSync('server/api/admin/dashboard.get.ts', 'utf8')
const participantsApi = readFileSync('server/api/admin/courses/[id]/participants.get.ts', 'utf8')
const participantsPage = readFileSync('app/pages/admin/cursos/[id]/inscritos.vue', 'utf8')
const participantDeleteApi = readFileSync('server/api/admin/courses/[id]/participants/[orderId].delete.ts', 'utf8')
const participantNotifyApi = readFileSync('server/api/admin/courses/[id]/participants/[enrollmentId]/notify.post.ts', 'utf8')
const participantRemovalMigration = readFileSync('supabase/migrations/20260821000100_admin_remove_course_participant.sql', 'utf8')
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
    expect(participantsApi).toContain('registration_contacts(full_name,email,whatsapp)')
    expect(participantsApi).toContain('phone: registration?.whatsapp ?? \'\'')
    expect(participantsApi).toContain('enrollmentId: enrollment?.id ?? null')
    expect(participantsApi).toContain('registrations: participants.length')
    expect(participantsPage).toContain('Inscrições recebidas')
    expect(participantsPage).toContain('item.enrollmentStatus ?? \'Não matriculado\'')
    expect(participantsPage).toContain('{{ phone(item.phone) }}')
    expect(participantsPage).toContain('${item.name} ${item.email} ${item.phone}')
  })

  it('removes a participant through the protected panel flow and releases a test identity', () => {
    expect(participantsPage).toContain('Remover participante')
    expect(participantDeleteApi).toContain('requireCourseManager(event, courseId)')
    expect(participantDeleteApi).toContain('admin.rpc(\'admin_remove_course_participant\'')
    expect(participantDeleteApi).toContain('admin.auth.admin.deleteUser(result.user_id)')
    expect(participantRemovalMigration).toContain('where id = target_order_id and course_id = target_course_id')
    expect(participantRemovalMigration).toContain('delete from public.registration_contacts')
    expect(participantRemovalMigration).toContain('p.role = \'STUDENT\'')
    expect(participantRemovalMigration).toContain('grant execute on function public.admin_remove_course_participant(uuid, uuid) to service_role')
  })

  it('reports the channels that actually resent a participant notification', () => {
    expect(participantNotifyApi).toContain('return { sent: true, sentChannels, skippedChannels }')
    expect(participantNotifyApi).toContain('Nenhum canal de notificação está configurado')
    expect(participantsPage).toContain('\'Primeiro acesso reenviado\'')
    expect(participantsPage).toContain('`${label} por ${channels}.`')
    expect(participantsPage).toContain('WhatsApp não está configurado')
  })

  it('generates and emails a new temporary password when first access is resent', () => {
    expect(participantNotifyApi).toContain('z.enum([\'ENROLLMENT_CONFIRMATION\', \'EVENT_CREDENTIAL\', \'PASSWORD_SETUP\'])')
    expect(participantNotifyApi).toContain('randomBytes(18).toString(\'base64url\')')
    expect(participantNotifyApi).toContain('admin.auth.admin.updateUserById')
    expect(participantNotifyApi).toContain('must_change_password: true')
    expect(participantNotifyApi).toContain('provider.sendPasswordSetup')
    expect(participantsPage).toContain('resend(item.enrollmentId, \'PASSWORD_SETUP\')')
    expect(participantsPage).toContain('Reenviar primeiro acesso')
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
