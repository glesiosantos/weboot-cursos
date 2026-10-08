import { createHash, randomBytes } from 'node:crypto'

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
export const createCredential = () => {
  const token = randomBytes(16).toString('hex').toUpperCase()
  return { token, code: token }
}

export const normalizeCredentialToken = (value: string) => {
  const trimmed = value.trim()
  let token = trimmed
  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(/\/checkin\/([^/]+)/)
    if (match?.[1]) { token = decodeURIComponent(match[1]) }
  }
  catch {
    const match = trimmed.match(/(?:^|\/)checkin\/([^/?#]+)/i)
    if (match?.[1]) { token = decodeURIComponent(match[1]) }
  }
  const normalized = token.trim().toUpperCase()
  return /^[A-F0-9]{32}$/.test(normalized) ? normalized : null
}

export const normalizeCommercialError = (message: string) => {
  if (message.includes('voucher invalid') || message.includes('voucher must be percentage based')) { return createError({ statusCode: 422, statusMessage: 'Voucher inválido.' }) }
  if (message.includes('voucher requires previous enrollment')) { return createError({ statusCode: 403, statusMessage: 'Este voucher é exclusivo para alunos com matrícula anterior.' }) }
  if (message.includes('voucher not valid for this course')) { return createError({ statusCode: 422, statusMessage: 'Este voucher não é válido para este curso.' }) }
  if (message.includes('voucher not started')) { return createError({ statusCode: 422, statusMessage: 'Este voucher ainda não está vigente.' }) }
  if (message.includes('voucher expired')) { return createError({ statusCode: 422, statusMessage: 'Este voucher expirou.' }) }
  if (message.includes('voucher exhausted')) { return createError({ statusCode: 422, statusMessage: 'Este voucher atingiu o limite de usos.' }) }
  if (message.includes('pending order has another voucher')) { return createError({ statusCode: 409, statusMessage: 'Já existe um pedido pendente com outro voucher. Aguarde a expiração antes de tentar novamente.' }) }
  if (message.includes('cpf already registered') || message.includes('registration_contacts_cpf_hash_key')) {
    return createError({ statusCode: 409, statusMessage: 'CPF já registrado.' })
  }
  if (message.includes('email already registered') || message.includes('registration_contacts_email_key')) {
    return createError({ statusCode: 409, statusMessage: 'E-mail já registrado.' })
  }
  if (message.includes('course already acquired')) { return createError({ statusCode: 409, statusMessage: 'Você já possui acesso a este curso.' }) }
  if (message.includes('sold out')) { return createError({ statusCode: 409, statusMessage: 'Não há vagas disponíveis.' }) }
  if (message.includes('no current course batch')) { return createError({ statusCode: 409, statusMessage: 'Não há lote vigente para este curso.' }) }
  if (message.includes('course unavailable')) { return createError({ statusCode: 404, statusMessage: 'Curso indisponível.' }) }
  return createError({ statusCode: 500, statusMessage: 'Não foi possível iniciar a compra.' })
}
