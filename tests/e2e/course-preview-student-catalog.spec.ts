import { expect, test } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const studentEmail = process.env.E2E_STUDENT_EMAIL
const studentPassword = process.env.E2E_STUDENT_PASSWORD
const courseId = process.env.E2E_PREVIEW_COURSE_ID
const courseSlug = process.env.E2E_PREVIEW_COURSE_SLUG
const courseTitle = process.env.E2E_PREVIEW_COURSE_TITLE

const login = async (page: import('@playwright/test').Page, email: string, password: string) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test.describe('admin preview flow', () => {
  test.skip(!(adminEmail && adminPassword && courseId && courseSlug && courseTitle), 'Configure as variáveis E2E_ADMIN_* e E2E_PREVIEW_COURSE_*')

  test('saved course preview matches the public presentation after publishing', async ({ page }) => {
    await login(page, adminEmail!, adminPassword!)
    await page.goto(`/admin/cursos/${courseId}`)
    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/cursos/${courseId}/preview`))
    await expect(page.getByText('PREVIEW DO CURSO')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: courseTitle! })).toBeVisible()
    await expect(page.getByText('Ações comerciais desativadas no preview')).toBeVisible()
    const previewPrice = await page.getByText('Investimento').locator('..').locator('p.text-3xl').textContent()
    if (await page.getByRole('button', { name: 'Publicar curso' }).isVisible().catch(() => false)) { await page.getByRole('button', { name: 'Publicar curso' }).click() }

    await page.goto(`/cursos/${courseSlug}`)
    await expect(page.getByRole('heading', { level: 1, name: courseTitle! })).toBeVisible()
    await expect(page.getByText('Investimento').locator('..').locator('p.text-3xl')).toHaveText(previewPrice ?? '')
  })
})

test.describe('student internal catalog flow', () => {
  test.skip(!(studentEmail && studentPassword && courseTitle), 'Configure E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD e E2E_PREVIEW_COURSE_TITLE')

  test('student opens the internal catalog and a published course without checkout', async ({ page }) => {
    await login(page, studentEmail!, studentPassword!)
    await page.goto('/aluno')
    await page.getByRole('link', { name: 'Ver catálogo completo' }).click()
    await expect(page).toHaveURL(/\/aluno\/catalogo/)
    await page.getByPlaceholder('Buscar cursos...').fill(courseTitle!)
    const card = page.locator('article').filter({ hasText: courseTitle! }).first()
    await expect(card).toBeVisible()
    await card.getByRole('link', { name: 'Ver curso' }).click()
    await expect(page.getByRole('heading', { level: 1, name: courseTitle! })).toBeVisible()
    await expect(page.getByRole('button', { name: 'ADQUIRIR CURSO' })).toBeVisible()
  })
})
