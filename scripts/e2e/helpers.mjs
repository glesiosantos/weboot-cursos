import { existsSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

export const loadEnvFile = (path) => {
  if (!existsSync(path)) { return }
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) { continue }
    const separator = line.indexOf('=')
    if (separator < 1) { continue }
    process.env[line.slice(0, separator)] ??= line.slice(separator + 1)
  }
}

export const loadE2EEnvironment = () => {
  loadEnvFile('.env')
  loadEnvFile('.env.e2e.local')
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL
  const secret = process.env.NUXT_SUPABASE_SECRET_KEY
  if (!url || !secret) { throw new Error('Configure NUXT_PUBLIC_SUPABASE_URL e NUXT_SUPABASE_SECRET_KEY localmente') }
  if (process.env.E2E_SUPABASE_ENV !== 'DEV') { throw new Error('Defina E2E_SUPABASE_ENV=DEV para autorizar exclusivamente o bootstrap DEV') }
  const host = new URL(url).hostname
  if (process.env.E2E_SUPABASE_DEV_HOST && host !== process.env.E2E_SUPABASE_DEV_HOST) {
    throw new Error('O host Supabase não corresponde a E2E_SUPABASE_DEV_HOST')
  }
  return { url, secret, host }
}

export const serviceClient = (url, secret) => createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export const findUserByEmail = async (client, email) => {
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
    if (error) { throw error }
    const user = data.users.find(candidate => candidate.email?.toLowerCase() === email.toLowerCase())
    if (user) { return user }
    if (data.users.length < 100) { return null }
  }
}

export const ensureUser = async (client, email, password, name) => {
  const existing = await findUserByEmail(client, email)
  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, name, e2e_fixture: true },
    })
    if (error) { throw error }
    return data.user
  }
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, e2e_fixture: true },
  })
  if (error || !data.user) { throw error ?? new Error(`Falha ao criar ${email}`) }
  return data.user
}

export const assertNoError = (result, context) => {
  if (result.error) { throw new Error(`${context}: ${result.error.message}`) }
  return result.data
}

export const executeDevManagementSql = async (host, query) => {
  const projectRef = host.split('.')[0]
  if (!projectRef || !host.endsWith('.supabase.co')) { throw new Error('Host Supabase DEV inválido') }
  const tokenPath = `${process.env.HOME}/.supabase/access-token`
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN || (existsSync(tokenPath) ? readFileSync(tokenPath, 'utf8').trim() : '')
  if (!accessToken) { throw new Error('Autenticação administrativa do Supabase CLI não encontrada') }
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { 'authorization': `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(`SQL administrativo DEV falhou (${response.status}): ${body.message ?? body.error ?? 'erro sem detalhes'}`)
  }
  return response.json()
}
