import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export const deactivateInstructor = async (client: SupabaseClient<Database>, id: string) => {
  const { error } = await client.from('instructors').update({ active: false }).eq('id', id)
  if (error) { throw createError({ statusCode: 400, statusMessage: error.message }) }
}
