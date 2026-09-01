import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'id')!
  await requireCourseManager(event, courseId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = serverSupabaseServiceRole(event) as any
  const { data: course, error: courseError } = await client.from('courses').select('id,title,course_type,status').eq('id', courseId).single()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { data, error } = await client.from('orders')
    .select('id,user_id,status,total,course_batch_id,created_at,registration_contacts(full_name,email,whatsapp),enrollments(id,status,profiles(name),event_credentials(code,status,used_at),attendance(status,checked_in_at))')
    .eq('course_id', courseId).order('created_at')
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar inscritos' }) }
  const { data: authUsers } = await client.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map(authUsers?.users?.map((user: { id: string, email?: string }) => [user.id, user.email ?? '']))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participants = (data ?? []).map((order: any) => {
    const enrollment = Array.isArray(order.enrollments) ? order.enrollments[0] : order.enrollments
    const registration = Array.isArray(order.registration_contacts) ? order.registration_contacts[0] : order.registration_contacts
    return {
      id: order.id,
      enrollmentId: enrollment?.id ?? null,
      name: registration?.full_name ?? enrollment?.profiles?.name ?? 'Aluno',
      email: registration?.email ?? emails.get(order.user_id) ?? '',
      phone: registration?.whatsapp ?? '',
      registeredAt: order.created_at,
      paymentStatus: order.status,
      total: order.total,
      courseBatchId: order.course_batch_id,
      enrollmentStatus: enrollment?.status ?? null,
      eventCredentials: enrollment?.event_credentials ?? [],
      attendance: enrollment?.attendance ?? [],
    }
  })
  if (getQuery(event).format === 'csv') {
    setHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setHeader(event, 'content-disposition', 'attachment; filename="inscritos.csv"')
    const clean = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    return ['Aluno,Email,Celular,Inscrição,Pagamento,Matrícula,Credencial,Check-in', ...participants.map((row: typeof participants[number]) => [row.name, row.email, row.phone, row.registeredAt, row.paymentStatus, row.enrollmentStatus, row.eventCredentials[0]?.status, row.attendance.some((item: { status?: string }) => item.status === 'PRESENT') ? 'Realizado' : ''].map(clean).join(','))].join('\n')
  }
  const paid = participants.filter((row: typeof participants[number]) => row.paymentStatus === 'PAID')
  return {
    course,
    summary: {
      registrations: participants.length,
      enrolled: participants.filter((row: typeof participants[number]) => row.enrollmentStatus === 'ACTIVE').length,
      paid: paid.length,
      pending: participants.filter((row: typeof participants[number]) => ['PENDING', 'WAITING_PAYMENT'].includes(row.paymentStatus)).length,
      revenue: paid.reduce((sum: number, row: typeof participants[number]) => sum + Number(row.total ?? 0), 0),
      credentials: participants.filter((row: typeof participants[number]) => row.eventCredentials[0]?.status === 'ACTIVE').length,
      checkedIn: participants.filter((row: typeof participants[number]) => row.attendance.some((item: { status?: string }) => item.status === 'PRESENT')).length,
      batchSales: paid.reduce((totals: Record<string, number>, row: typeof participants[number]) => {
        if (row.courseBatchId) { totals[row.courseBatchId] = (totals[row.courseBatchId] ?? 0) + 1 }
        return totals
      }, {}),
    },
    participants,
  }
})
