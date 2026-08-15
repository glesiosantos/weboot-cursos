import { z } from 'zod'
import { getPasswordRecoveryRedirect } from '~/utils/auth-redirect'

export const signInSchema = z.object({
  email: z.email('Informe um email válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

export const signUpSchema = z.object({
  email: z.email('Informe um email válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  name: z.string().trim().min(2).max(120),
})

export const useAuth = () => {
  const client = useSupabaseClient()

  const signIn = async (input: { email: string, password: string }) => {
    const credentials = signInSchema.parse(input)
    return await client.auth.signInWithPassword(credentials)
  }

  const signUp = async (input: { name: string, email: string, password: string }) => {
    const credentials = signUpSchema.parse(input)
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

  const updatePassword = async (newPassword: string, nonce?: string) => {
    const password = z.string().min(6).max(128).parse(newPassword)
    const { data: { session }, error: sessionError } = await client.auth.getSession()

    if (sessionError || !session) {
      return { error: sessionError ?? new Error('AUTH_SESSION_MISSING'), sessionExpired: true }
    }

    const { error } = await client.auth.updateUser({ password, ...(nonce ? { nonce } : {}) })
    const errorCode = error?.code ?? ''
    const sessionExpired = errorCode.includes('session') || errorCode.includes('refresh_token')
    return { error, sessionExpired, reauthenticationNeeded: errorCode === 'reauthentication_needed' }
  }

  const reauthenticate = async () => await client.auth.reauthenticate()

  const refreshSession = async () => await client.auth.refreshSession()

  const signOut = async () => await client.auth.signOut()

  return { signIn, signUp, resetPassword, updatePassword, reauthenticate, refreshSession, signOut }
}
