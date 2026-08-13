import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/supabase'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    supabaseSecretKey: '',
    asaasApiKey: '',
    asaasApiUrl: 'https://api-sandbox.asaas.com/v3',
    asaasWebhookToken: '',
    registrationDataKey: '',
    notificationWebhookUrl: '',
    notificationWebhookToken: '',
    public: { appUrl: 'http://localhost:3000' },
  },
  routeRules: {
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/aluno/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/conta/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  compatibilityDate: '2025-07-15',
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true },
  eslint: { config: { stylistic: { semi: false, quotes: 'single' } } },
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirmacao',
      exclude: ['/', '/cursos', '/cursos/**', '/inscricao/**', '/api/courses/**', '/api/registrations/**', '/login', '/cadastro', '/esqueci-minha-senha', '/redefinir-senha', '/confirmacao'],
    },
  },
})
