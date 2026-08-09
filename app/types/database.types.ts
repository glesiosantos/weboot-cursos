export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
export type CourseType = 'ONLINE' | 'PRESENCIAL'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string, name: string, avatar_path: string | null, phone: string | null, role: UserRole, created_at: string, updated_at: string }
        Insert: { id: string, name: string, avatar_path?: string | null, phone?: string | null, role?: UserRole }
        Update: { name?: string, avatar_path?: string | null, phone?: string | null }
        Relationships: []
      }
      instructors: {
        Row: { id: string, profile_id: string | null, name: string, bio: string | null, avatar_path: string | null, active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, profile_id?: string | null, name: string, bio?: string | null, avatar_path?: string | null, active?: boolean }
        Update: { name?: string, bio?: string | null, avatar_path?: string | null, active?: boolean }
        Relationships: []
      }
      courses: {
        Row: { id: string, instructor_id: string | null, title: string, slug: string, short_description: string, description: string, cover_path: string | null, course_type: CourseType, workload_minutes: number, price: number, promotional_price: number | null, status: CourseStatus, program: string | null, requirements: string | null, target_audience: string | null, address: string | null, city: string | null, state: string | null, venue: string | null, starts_at: string | null, ends_at: string | null, schedule: string | null, max_students: number | null, cancellation_policy: string | null, additional_info: string | null, published_at: string | null, archived_at: string | null, created_at: string, updated_at: string }
        Insert: { id?: string, instructor_id?: string | null, title: string, slug: string, short_description: string, description: string, cover_path?: string | null, course_type: CourseType, workload_minutes: number, price: number, promotional_price?: number | null, status?: CourseStatus, starts_at?: string | null, max_students?: number | null }
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
        Relationships: [{ foreignKeyName: 'courses_instructor_id_fkey', columns: ['instructor_id'], isOneToOne: false, referencedRelation: 'instructors', referencedColumns: ['id'] }]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: { user_role: UserRole, course_type: CourseType, course_status: CourseStatus }
    CompositeTypes: Record<string, never>
  }
}
