import { expect, test } from '@playwright/test'

test('visitor can navigate to authentication', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cursos práticos')
  await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('protected student area redirects visitors', async ({ page }) => {
  await page.goto('/aluno')
  await expect(page).toHaveURL(/\/login$/)
})
