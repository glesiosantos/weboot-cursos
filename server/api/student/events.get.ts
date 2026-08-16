import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../utils/auth'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.from('enrollments')
    .select('id,status,profiles(name),courses(id,title,course_type,course_presential_details(location_name,address,address_number,city,state,starts_at,ends_at)),event_credentials(code,status,issued_at,used_at)')
    .eq('user_id', user.sub).eq('status', 'ACTIVE')
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar eventos' }) }
  return (data ?? []).filter(item => !Array.isArray(item.courses) && item.courses?.course_type === 'PRESENCIAL')
})
