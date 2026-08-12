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

test('forgot-password page renders publicly', async ({ page }) => {
  await page.goto('/esqueci-minha-senha')
  await expect(page.getByRole('heading', { name: 'Esqueci minha senha' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar link de recuperação' })).toBeVisible()
})

test('recovery page is public and rejects a missing session safely', async ({ page }) => {
  await page.goto('/redefinir-senha')
  await expect(page).toHaveURL(/\/redefinir-senha$/)
  await expect(page.getByText('Este link de recuperação expirou ou não é mais válido.')).toBeVisible()
})

test('admin area redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('protected student area redirects visitors', async ({ page }) => {
  await page.goto('/aluno')
  await expect(page).toHaveURL(/\/login$/)
})

test('account security redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/conta/seguranca')
  await expect(page).toHaveURL(/\/login$/)
})

test('commercial and check-in routes reject anonymous access', async ({ page }) => {
  for (const path of ['/checkout/retorno?pedido=a174f612-35c6-45c0-bf07-a0047bb6fdd3', '/admin/cursos/a174f612-35c6-45c0-bf07-a0047bb6fdd3/checkin']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login/)
  }
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
