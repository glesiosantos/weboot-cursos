import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

const digits = (value: string) => value.replace(/\D/g, '')

export const isValidCpf = (value: string) => {
  const cpf = digits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) { return false }
  const digit = (length: number) => {
    const sum = cpf.slice(0, length).split('').reduce((total, number, index) => total + Number(number) * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export const normalizeWhatsapp = (value: string) => {
  let phone = digits(value)
  if (phone.startsWith('00')) { phone = phone.slice(2) }
  if (phone.length === 10 || phone.length === 11) { phone = `55${phone}` }
  return phone.length >= 12 && phone.length <= 15 ? `+${phone}` : null
}

export const guestRegistrationSchema = z.object({
  course_id: z.uuid('Curso inválido'),
  full_name: z.string().trim()
    .min(6, 'O nome deve ter no mínimo 6 caracteres')
    .max(150, 'O nome deve ter no máximo 150 caracteres'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido').transform(digits),
  whatsapp: z.string().transform(normalizeWhatsapp).refine(value => value !== null, 'WhatsApp inválido'),
  email: z.email('Email inválido').transform(value => value.trim().toLowerCase()),
  terms_accepted: z.literal(true, 'Aceite os Termos de Uso e a Política de Privacidade'),
  marketing_accepted: z.boolean().default(false),
}).strict()

const keyedHash = (value: string, secret: string) => createHash('sha256').update(`${secret}:${value}`).digest('hex')

export const protectRegistration = (cpf: string, secret: string) => {
  if (secret.length < 32) { throw createError({ statusCode: 503, statusMessage: 'Proteção de dados da inscrição não configurada' }) }
  const key = createHash('sha256').update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()])
  return {
    cpfHash: keyedHash(cpf, secret),
    cpfEncrypted: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64'),
  }
}
