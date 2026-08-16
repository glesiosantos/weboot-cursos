import type { Database } from '~/types/database.types'

export const useActiveCourseEnrollments = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  return useAsyncData('active-course-enrollments', async () => {
    if (!user.value) { return new Set<string>() }
    const { data, error } = await client.from('enrollments').select('course_id').eq('user_id', user.value.sub).eq('status', 'ACTIVE')
    if (error) { throw createError({ statusCode: 503, statusMessage: 'Não foi possível consultar suas matrículas.' }) }
    return new Set((data ?? []).map(enrollment => enrollment.course_id))
  })
}
