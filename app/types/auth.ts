export const USER_ROLES = ['ADMIN', 'INSTRUCTOR', 'STUDENT'] as const
export type UserRole = typeof USER_ROLES[number]

export interface UserProfile {
  id: string
  name: string
  avatar_path: string | null
  phone: string | null
  role: UserRole
}
