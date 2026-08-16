import { expect, test } from '@playwright/test'

test('public catalog offers search and modality filters', async ({ page }) => {
  await page.goto('/cursos')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cursos para colocar')
  await expect(page.getByPlaceholder('Buscar cursos...')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Online' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Presencial' })).toBeVisible()
})

test('draft slug is not publicly available', async ({ page }) => {
  const response = await page.goto('/cursos/curso-interno-revisao')
  expect(response?.status()).toBe(404)
})

for (const width of [375, 390, 768, 1024, 1280, 1440]) {
  test(`catalog remains responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/cursos')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })
}
