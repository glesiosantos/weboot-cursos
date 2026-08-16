import { expect, test } from '@playwright/test'

test('visitor opens registration form without login', async ({ page }) => {
  const slug = process.env.E2E_GUEST_COURSE_SLUG
  test.skip(!slug, 'E2E_GUEST_COURSE_SLUG não configurado')
  await page.goto(`/cursos/${slug}`)
  await page.getByRole('link', { name: 'QUERO ME INSCREVER' }).click()
  await expect(page).toHaveURL(new RegExp(`/cursos/${slug}/inscricao$`))
  await expect(page.getByRole('heading', { name: process.env.E2E_GUEST_COURSE_TITLE })).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toBeVisible()
  await expect(page.getByLabel('CPF')).toBeVisible()
  await expect(page.getByLabel('WhatsApp')).toBeVisible()
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
  await expect(page.getByText('Você não precisa criar uma conta ou senha agora.')).toBeVisible()
})
