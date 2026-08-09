import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
  const client = useSupabaseClient<Database>()
  const { data, error } = await client.from('profiles').select('role').eq('id', user.value.id).single()
  if (error || !canAccessAdmin(data?.role)) {
    return navigateTo('/aluno')
  }
})
