// Supabase service-role client includes Auth Admin methods not represented by generated database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

export const ensureStudentAccount = async (admin: AdminClient, registration: { full_name: string, email: string, whatsapp: string }) => {
  let page = 1
  let user: { id: string, email?: string } | undefined
  do {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { throw error }
    user = data.users.find((candidate: { email?: string }) => candidate.email?.toLowerCase() === registration.email.toLowerCase())
    if (user || data.users.length < 1000) { break }
    page += 1
  } while (page <= 10)

  let passwordSetupSent = false
  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(registration.email, {
      data: { name: registration.full_name, role: 'STUDENT' },
    })
    if (error || !data.user) { throw error ?? new Error('Não foi possível iniciar a criação da conta') }
    user = data.user
    passwordSetupSent = true
  }
  if (!user) { throw new Error('Conta do aluno não pôde ser localizada') }
  const { data: currentProfile, error: currentProfileError } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (currentProfileError || currentProfile?.role !== 'STUDENT') {
    throw createError({ statusCode: 409, statusMessage: 'Este email pertence a uma conta administrativa e não pode ser associado à inscrição.' })
  }
  const { error: profileError } = await admin.from('profiles').update({
    name: registration.full_name, phone: registration.whatsapp,
  }).eq('id', user.id)
  if (profileError) { throw profileError }
  return { userId: user.id, passwordSetupSent }
}
