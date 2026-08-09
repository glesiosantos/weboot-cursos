export const getPasswordRecoveryRedirect = (origin: string) =>
  `${origin.replace(/\/$/, '')}/redefinir-senha`
