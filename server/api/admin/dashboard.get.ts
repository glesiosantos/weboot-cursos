import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/auth'

type OrderRow = {
  id: string
  status: string
  total: number | string
  paid_at: string | null
  created_at: string
  courses: { id: string, title: string } | { id: string, title: string }[] | null
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  // Service role is used after the admin check so totals are not affected by row policies.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('orders')
    .select('id,status,total,paid_at,created_at,courses(id,title)')
    .order('created_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar as vendas' }) }

  const orders = (data ?? []) as OrderRow[]
  const paid = orders.filter(order => order.status === 'PAID')
  const revenue = paid.reduce((sum, order) => sum + Number(order.total), 0)
  const byCourse = new Map<string, { courseId: string, title: string, sales: number, revenue: number }>()
  for (const order of paid) {
    const course = Array.isArray(order.courses) ? order.courses[0] : order.courses
    const key = course?.id ?? 'unknown'
    const current = byCourse.get(key) ?? { courseId: key, title: course?.title ?? 'Curso removido', sales: 0, revenue: 0 }
    current.sales += 1
    current.revenue += Number(order.total)
    byCourse.set(key, current)
  }

  return {
    summary: {
      revenue, paidOrders: paid.length,
      pendingOrders: orders.filter(order => ['PENDING', 'WAITING_PAYMENT'].includes(order.status)).length,
      averageTicket: paid.length ? revenue / paid.length : 0,
    },
    byCourse: [...byCourse.values()].sort((a, b) => b.revenue - a.revenue),
    recentSales: paid.slice(0, 8).map((order) => {
      const course = Array.isArray(order.courses) ? order.courses[0] : order.courses
      return { id: order.id, courseTitle: course?.title ?? 'Curso removido', total: Number(order.total), paidAt: order.paid_at ?? order.created_at }
    }),
  }
})
