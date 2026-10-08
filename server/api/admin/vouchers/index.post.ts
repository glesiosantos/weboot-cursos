import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform(value => value.toUpperCase()),
  value: z.coerce.number().positive().max(100),
  course_id: z.uuid().nullable().optional(),
  max_uses: z.coerce.number().int().positive().nullable().optional(),
  starts_at: z.iso.datetime().nullable().optional(),
  expires_at: z.iso.datetime().nullable().optional(),
  alumni_only: z.boolean().default(true),
}).strict()

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? 'Dados do voucher inválidos' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient<Database>(event) as any
  const { data, error } = await client.from('coupons').insert({
    code: parsed.data.code, type: 'PERCENTAGE', value: parsed.data.value,
    course_id: parsed.data.course_id ?? null, max_uses: parsed.data.max_uses ?? null,
    starts_at: parsed.data.starts_at ?? null, expires_at: parsed.data.expires_at ?? null,
    alumni_only: parsed.data.alumni_only,
  }).select().single()
  if (error) { throw createError({ statusCode: 409, statusMessage: error.code === '23505' ? 'Este código já existe' : 'Não foi possível criar o voucher' }) }
  return data
})
