import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('enrollments').select('id,status,enrolled_at,courses(id,title,slug,short_description,course_type,cover_path)')
    .eq('user_id', user.sub).eq('status', 'ACTIVE').order('enrolled_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar seus cursos' }) }
  return data
})
