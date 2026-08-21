import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../../utils/auth'

const removalError = (message: string) => {
  if (message.includes('participant not found')) {
    return createError({ statusCode: 404, statusMessage: 'Participante não encontrado neste curso' })
  }
  if (message.includes('participant has other registrations')) {
    return createError({ statusCode: 409, statusMessage: 'Este participante possui outras inscrições. A remoção completa deve ser feita com suporte técnico.' })
  }
  return createError({ statusCode: 500, statusMessage: 'Não foi possível remover o participante' })
}

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'id') || ''
  const orderId = getRouterParam(event, 'orderId') || ''
  await requireCourseManager(event, courseId)
  // Service role is required because the operation removes protected commercial and personal data.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.rpc('admin_remove_course_participant', {
    target_course_id: courseId,
    target_order_id: orderId,
  })
  if (error) { throw removalError(error.message ?? '') }

  const result = Array.isArray(data) ? data[0] : data
  let authUserDeleted = false
  if (result?.delete_auth_user && result.user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(result.user_id)
    if (authError) {
      throw createError({
        statusCode: 502,
        statusMessage: 'A inscrição foi removida, mas a conta de acesso não pôde ser excluída. Tente novamente antes de refazer o teste de email.',
      })
    }
    authUserDeleted = true
  }

  return { removed: true, authUserDeleted }
})
