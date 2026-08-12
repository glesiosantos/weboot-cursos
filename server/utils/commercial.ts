import { createHash, randomBytes } from 'node:crypto'

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
export const createCredential = () => {
  const token = randomBytes(16).toString('hex').toUpperCase()
  return { token, code: token }
}

export const normalizeCommercialError = (message: string) => {
  if (message.includes('course already acquired')) { return createError({ statusCode: 409, statusMessage: 'Você já possui acesso a este curso.' }) }
  if (message.includes('sold out')) { return createError({ statusCode: 409, statusMessage: 'Não há vagas disponíveis.' }) }
  if (message.includes('no current course batch')) { return createError({ statusCode: 409, statusMessage: 'Não há lote vigente para este curso.' }) }
  if (message.includes('course unavailable')) { return createError({ statusCode: 404, statusMessage: 'Curso indisponível.' }) }
  return createError({ statusCode: 500, statusMessage: 'Não foi possível iniciar a compra.' })
}
