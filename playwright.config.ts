import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      NUXT_PUBLIC_SUPABASE_URL: process.env.NUXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      NUXT_PUBLIC_SUPABASE_KEY: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? 'local-test-anon-key',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
