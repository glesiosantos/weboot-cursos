export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL
  const key = process.env.NUXT_PUBLIC_SUPABASE_KEY
  if (import.meta.dev && (!url || !key)) {
    console.warn('[env] NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY são obrigatórias para conectar ao catálogo.')
  }
  if (config.supabaseSecretKey && import.meta.client) {
    throw new Error('A service role do Supabase nunca pode ser exposta no cliente.')
  }
})
