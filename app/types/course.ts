import type { CoursePricingType, CourseStatus, CourseType, LessonType } from './database.types'

export type CourseMode = 'TODOS' | CourseType

export interface PresentialDetails {
  location_name: string
  address: string | null
  address_number: string | null
  complement: string | null
  neighborhood: string | null
  city: string
  state: string
  postal_code: string | null
  starts_at: string
  ends_at: string
  registration_deadline: string | null
  max_students: number
}

export interface PublicLesson { id: string, title: string, description: string | null, lesson_type: LessonType, duration_minutes: number | null, position: number, is_preview: boolean }
export interface PublicModule { id: string, title: string, description: string | null, position: number, lessons: PublicLesson[] }
export interface Course {
  id: string
  title: string
  slug: string
  short_description: string
  description?: string
  course_type: CourseType
  status?: CourseStatus
  workload_hours: number
  price: number
  promotional_price: number | null
  pricing_type?: CoursePricingType
  current_batch?: { id: string, name: string, position: number, price: number, max_sales: number | null, starts_at: string | null, ends_at: string | null } | null
  public_price?: number | null
  cover_url: string | null
  instructor_name: string | null
  instructor_bio?: string | null
  program?: string | null
  requirements?: string | null
  target_audience?: string | null
  presential?: PresentialDetails | null
  modules?: PublicModule[]
  updated_at?: string
  archived_at?: string | null
}
