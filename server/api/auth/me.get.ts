import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { id: user.id, email: user.email }
})
