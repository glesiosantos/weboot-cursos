export const resolveAuthenticatedUserId = async () => {
  const reactiveUser = useSupabaseUser()
  if (reactiveUser.value?.sub) { return reactiveUser.value.sub }
  const client = useSupabaseClient()
  const { data, error } = await client.auth.getUser()
  return error ? null : data.user?.id ?? null
}
