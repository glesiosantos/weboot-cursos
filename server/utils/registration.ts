import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
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
  postal_code: z.string().transform(digits).refine(value => value.length === 8, 'CEP inválido'),
  address: z.string().trim().min(3, 'Endereço inválido').max(255, 'Endereço muito longo'),
  address_number: z.string().trim().min(1, 'Informe o número do endereço').max(20, 'Número do endereço muito longo'),
  complement: z.string().trim().max(255, 'Complemento muito longo').default(''),
  province: z.string().trim().min(2, 'Bairro inválido').max(100, 'Bairro muito longo'),
  city: z.string().trim().min(2, 'Cidade inválida').max(100, 'Cidade muito longa'),
  city_ibge: z.string().regex(/^\d{7}$/, 'Consulte um CEP válido').transform(Number),
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

export const revealRegistrationCpf = (protectedValue: string, secret: string) => {
  if (secret.length < 32) { throw new Error('Proteção de dados da inscrição não configurada') }
  const payload = Buffer.from(protectedValue, 'base64')
  if (payload.length < 29) { throw new Error('CPF protegido inválido') }
  const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8')
}
