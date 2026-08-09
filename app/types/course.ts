export type CourseMode = 'TODOS' | 'ONLINE' | 'PRESENCIAL'
export interface Course { id: string, title: string, slug: string, short_description: string, course_type: Exclude<CourseMode, 'TODOS'>, workload_minutes: number, price: number, promotional_price: number | null, starts_at: string | null, cover_url: string | null, instructor_name: string | null }
