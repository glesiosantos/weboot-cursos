import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../utils/auth'
import type { Database } from '~/types/database.types'

const schema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().min(10).max(20) }).strict()
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 400, statusMessage: 'Informe nome e telefone válidos' }) }
  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.from('profiles').update(body.data).eq('id', user.sub)
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível atualizar o perfil' }) }
  return { updated: true }
})
