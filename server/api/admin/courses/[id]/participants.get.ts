import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'id')!
  await requireCourseManager(event, courseId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = serverSupabaseServiceRole(event) as any
  const { data, error } = await client.from('enrollments')
    .select('id,user_id,status,enrolled_at,profiles(name),orders(status,total),event_credentials(code,status,used_at),attendance(status,checked_in_at)')
    .eq('course_id', courseId).order('enrolled_at')
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar inscritos' }) }
  const { data: authUsers } = await client.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map(authUsers?.users?.map((user: { id: string, email?: string }) => [user.id, user.email ?? '']))
  const participants = (data ?? []).map((row: { user_id: string }) => ({ ...row, email: emails.get(row.user_id) ?? '' }))
  if (getQuery(event).format === 'csv') {
    setHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setHeader(event, 'content-disposition', 'attachment; filename="inscritos.csv"')
    const clean = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ['Aluno,Email,Matrícula,Pagamento,Credencial,Check-in', ...participants.map((row: any) => [row.profiles?.name, row.email, row.status, row.orders?.status, row.event_credentials?.[0]?.status, row.attendance?.[0]?.status].map(clean).join(','))].join('\n')
  }
  return participants
})
