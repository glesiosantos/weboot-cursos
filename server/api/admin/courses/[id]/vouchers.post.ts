import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireRole } from '../../../../utils/auth'

const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).transform(value => value.toUpperCase()),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive(),
  max_uses: z.coerce.number().int().positive().nullable().optional(),
  starts_at: z.iso.datetime().nullable().optional(),
  expires_at: z.iso.datetime().nullable().optional(),
}).refine(input => input.type !== 'PERCENTAGE' || input.value <= 100, { message: 'O percentual deve ser de até 100%' }).strict()

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const courseId = z.uuid().parse(getRouterParam(event, 'id'))
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) { throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? 'Dados do voucher inválidos' }) }
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error: courseError } = await client.from('courses').select('id').eq('id', courseId).maybeSingle()
  if (courseError || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { data, error } = await client.from('coupons').insert({
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    course_id: courseId,
    max_uses: parsed.data.max_uses ?? null,
    starts_at: parsed.data.starts_at ?? null,
    expires_at: parsed.data.expires_at ?? null,
    alumni_only: true,
  }).select().single()
  if (error) {
    if (error.code === '23505') { throw createError({ statusCode: 409, statusMessage: 'Este código de voucher já existe' }) }
    throw createError({ statusCode: 400, statusMessage: 'Não foi possível criar o voucher. Verifique se as migrations de vouchers foram aplicadas.' })
  }
  return data
})
