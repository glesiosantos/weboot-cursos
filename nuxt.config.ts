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
    asaasPixPercent: 0,
    asaasPixFixed: 0,
    asaasCardCashPercent: 0,
    asaasCardInstallmentPercent: 2.49,
    asaasCardFixed: 5.49,
    paymentServiceFee: 0,
    registrationDataKey: '',
    notificationWebhookUrl: '',
    notificationWebhookToken: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    public: { appUrl: 'http://localhost:3000' },
  },
  routeRules: {
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/aluno/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/conta/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['virulent-rodney-aghastly.ngrok-free.dev'],
    },
  },
  typescript: { strict: true },
  eslint: { config: { stylistic: { semi: false, quotes: 'single' } } },
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirmacao',
      exclude: ['/', '/cursos', '/cursos/**', '/inscricao/**', '/pagamento/**', '/api/courses/**', '/api/registrations/**', '/api/payments/**', '/login', '/cadastro', '/esqueci-minha-senha', '/redefinir-senha', '/confirmacao'],
    },
  },
})
