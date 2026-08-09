import { z } from 'zod'

export const changePasswordSchema = z.object({
  newPassword: z.string()
    .min(1, 'Informe a nova senha')
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(128, 'A senha deve ter no máximo 128 caracteres'),
  passwordConfirmation: z.string()
    .min(1, 'Confirme a nova senha')
    .max(128, 'A confirmação deve ter no máximo 128 caracteres'),
}).refine(input => input.newPassword === input.passwordConfirmation, {
  message: 'As senhas não coincidem',
  path: ['passwordConfirmation'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const getChangePasswordErrors = (input: ChangePasswordInput) => {
  const result = changePasswordSchema.safeParse(input)
  if (result.success) {
    return {}
  }

  return Object.fromEntries(
    result.error.issues.map(issue => [String(issue.path[0]), issue.message]),
  ) as Partial<Record<keyof ChangePasswordInput, string>>
}
