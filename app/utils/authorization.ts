import type { UserRole } from '~/types/database.types'

export const canAccessAdmin = (role: UserRole | null | undefined) => role === 'ADMIN'

export const getAuthenticatedHome = (role: UserRole | null | undefined) => canAccessAdmin(role) ? '/admin' : '/aluno'
