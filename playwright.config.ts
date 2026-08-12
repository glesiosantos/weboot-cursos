import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const localE2EEnv = '.env.e2e.local'
if (existsSync(localE2EEnv)) {
  for (const line of readFileSync(localE2EEnv, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) { continue }
    const separator = line.indexOf('=')
    if (separator < 1) { continue }
    const key = line.slice(0, separator)
    process.env[key] ??= line.slice(separator + 1)
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    env: {
      NUXT_PUBLIC_SUPABASE_URL: process.env.NUXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      NUXT_PUBLIC_SUPABASE_KEY: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? 'local-test-anon-key',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
