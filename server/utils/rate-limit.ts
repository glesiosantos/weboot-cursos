import type { H3Event } from 'h3'

const attempts = new Map<string, { count: number, resetAt: number }>()

export const enforceRegistrationRateLimit = (event: H3Event, limit = 8, windowMs = 15 * 60_000) => {
  const key = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  current.count += 1
  if (current.count > limit) {
    setResponseHeader(event, 'retry-after', Math.ceil((current.resetAt - now) / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
  }
}
