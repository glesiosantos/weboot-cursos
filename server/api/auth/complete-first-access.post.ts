import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  // Service-role Auth Admin methods are not represented by the generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.auth.admin.getUserById(user.sub)
  if (error || !data.user) { throw error ?? createError({ statusCode: 404, statusMessage: 'Conta não encontrada' }) }
  const { error: updateError } = await admin.auth.admin.updateUserById(user.sub, {
    app_metadata: { ...data.user.app_metadata, must_change_password: false },
  })
  if (updateError) { throw updateError }
  return { completed: true }
})
