import type { Course } from '~/types/course'
import type { Database } from '~/types/database.types'

export const usePublishedCourses = () => {
  const client = useSupabaseClient<Database>()
  return useAsyncData('published-courses', async (): Promise<Course[]> => {
    const { data, error } = await client.from('courses').select('id,title,slug,short_description,course_type,workload_hours,price,promotional_price,cover_path,instructors(name),course_presential_details(location_name,city,state,starts_at,ends_at,max_students)').eq('status', 'PUBLISHED').is('archived_at', null).order('published_at', { ascending: false })
    if (error) {
      console.error('[courses] Falha ao carregar catálogo público:', error.message)
      throw createError({ statusCode: 503, statusMessage: 'Não foi possível carregar os cursos publicados.' })
    }
    return (data ?? []).map(course => ({ ...course, workload_hours: Number(course.workload_hours), price: Number(course.price), promotional_price: course.promotional_price === null ? null : Number(course.promotional_price), cover_url: course.cover_path ? client.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null, instructor_name: Array.isArray(course.instructors) ? course.instructors[0]?.name ?? null : course.instructors?.name ?? null, presential: Array.isArray(course.course_presential_details) ? course.course_presential_details[0] ?? null : course.course_presential_details }))
  })
}
