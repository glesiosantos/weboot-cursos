export const apiErrorMessage = (error: unknown, fallback: string) => {
  const response = error as { data?: { statusMessage?: unknown }, statusMessage?: unknown }
  const message = response.data?.statusMessage ?? response.statusMessage
  return typeof message === 'string' && message.trim() ? message : fallback
}
