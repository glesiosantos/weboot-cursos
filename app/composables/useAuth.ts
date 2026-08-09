import { z } from 'zod'

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
    return await client.auth.resetPasswordForEmail(parsedEmail, {
      redirectTo: `${config.public.appUrl}/confirmacao`,
    })
  }

  return { signIn, signUp, resetPassword }
}
