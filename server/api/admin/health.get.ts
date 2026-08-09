import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  return { status: 'ok' }
})
