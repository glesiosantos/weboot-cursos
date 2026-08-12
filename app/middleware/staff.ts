import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) { return navigateTo('/login') }
  const client = useSupabaseClient<Database>()
  const { data } = await client.from('profiles').select('role').eq('id', user.value.sub).single()
  if (!data || !['ADMIN', 'INSTRUCTOR'].includes(data.role)) { return navigateTo('/aluno') }
})
