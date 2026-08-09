export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string, name: string, avatar_path: string | null, phone: string | null, role: UserRole, created_at: string, updated_at: string }
        Insert: { id: string, name: string, avatar_path?: string | null, phone?: string | null, role?: UserRole }
        Update: { name?: string, avatar_path?: string | null, phone?: string | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: { user_role: UserRole }
    CompositeTypes: Record<string, never>
  }
}
