import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'id')!
  await requireCourseManager(event, courseId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = serverSupabaseServiceRole(event) as any
  const { data: course, error: courseError } = await client.from('courses').select('id,title,course_type,status').eq('id', courseId).single()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { data, error } = await client.from('enrollments')
    .select('id,user_id,status,enrolled_at,profiles(name),orders(status,total,course_batch_id),event_credentials(code,status,used_at),attendance(status,checked_in_at)')
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
  const paid = participants.filter((row: { orders?: { status?: string } | null }) => row.orders?.status === 'PAID')
  return {
    course,
    summary: {
      enrolled: participants.filter((row: { status: string }) => row.status === 'ACTIVE').length,
      paid: paid.length,
      pending: participants.filter((row: { orders?: { status?: string } | null }) => ['PENDING', 'WAITING_PAYMENT'].includes(row.orders?.status ?? '')).length,
      revenue: paid.reduce((sum: number, row: { orders?: { total?: number | string } | null }) => sum + Number(row.orders?.total ?? 0), 0),
      credentials: participants.filter((row: { event_credentials?: { status?: string }[] }) => row.event_credentials?.[0]?.status === 'ACTIVE').length,
      checkedIn: participants.filter((row: { attendance?: { status?: string }[] }) => row.attendance?.some(item => item.status === 'PRESENT')).length,
      batchSales: paid.reduce((totals: Record<string, number>, row: { orders?: { course_batch_id?: string | null } | null }) => {
        if (row.orders?.course_batch_id) { totals[row.orders.course_batch_id] = (totals[row.orders.course_batch_id] ?? 0) + 1 }
        return totals
      }, {}),
    },
    participants,
  }
})
