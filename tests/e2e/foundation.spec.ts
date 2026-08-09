import { expect, test } from '@playwright/test'

test('visitor can navigate to authentication', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Conhecimento prático')
  await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('login renders the complete authentication form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeVisible()
})

test('admin area redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('protected student area redirects visitors', async ({ page }) => {
  await page.goto('/aluno')
  await expect(page).toHaveURL(/\/login$/)
})

for (const width of [375, 390, 768, 1024, 1280, 1440]) {
  test(`home remains responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}
