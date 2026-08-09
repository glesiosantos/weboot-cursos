import type { UserRole } from '~/types/database.types'

export const canAccessAdmin = (role: UserRole | null | undefined) => role === 'ADMIN'
