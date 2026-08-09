import { z } from 'zod'
import { getPasswordRecoveryRedirect } from '~/utils/auth-redirect'

const credentialsSchema = z.object({
  email: z.email('Informe um email válido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export const useAuth = () => {
  const client = useSupabaseClient()

  const signIn = async (input: { email: string, password: string }) => {
    const credentials = credentialsSchema.parse(input)
    return await client.auth.signInWithPassword(credentials)
  }

  const signUp = async (input: { name: string, email: string, password: string }) => {
    const credentials = credentialsSchema.extend({ name: z.string().trim().min(2).max(120) }).parse(input)
    return await client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: { data: { name: credentials.name } },
    })
  }

  const resetPassword = async (email: string) => {
    const parsedEmail = z.email().parse(email)
    const config = useRuntimeConfig()
    const origin = import.meta.client ? window.location.origin : config.public.appUrl
    return await client.auth.resetPasswordForEmail(parsedEmail, {
      redirectTo: getPasswordRecoveryRedirect(origin),
    })
  }

  const updatePassword = async (newPassword: string) => {
    const password = z.string().min(8).max(128).parse(newPassword)
    const { data: { session }, error: sessionError } = await client.auth.getSession()

    if (sessionError || !session) {
      return { error: sessionError ?? new Error('AUTH_SESSION_MISSING'), sessionExpired: true }
    }

    const { error } = await client.auth.updateUser({ password })
    const errorCode = error?.code ?? ''
    const sessionExpired = errorCode.includes('session') || errorCode.includes('refresh_token')
    return { error, sessionExpired }
  }

  const signOut = async () => await client.auth.signOut()

  return { signIn, signUp, resetPassword, updatePassword, signOut }
}
