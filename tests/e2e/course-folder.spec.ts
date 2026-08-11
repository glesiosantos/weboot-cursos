import { expect, test } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const courseId = process.env.E2E_FOLDER_COURSE_ID
const courseSlug = process.env.E2E_FOLDER_COURSE_SLUG
const configured = Boolean(adminEmail && adminPassword && courseId && courseSlug)
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')

test.describe('course promotional folder flow', () => {
  test.skip(!configured, 'Configure E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_FOLDER_COURSE_ID and E2E_FOLDER_COURSE_SLUG')

  test('admin uploads and replaces the folder shown on the public course page', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(adminEmail!)
    await page.getByLabel('Senha').fill(adminPassword!)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()

    await page.goto(`/admin/cursos/${courseId}`)
    const media = page.locator('article').filter({ hasText: 'Folder promocional' })
    await media.getByLabel('Texto alternativo').fill('Folder promocional de teste')
    await media.locator('input[type="file"]').setInputFiles({ name: 'folder-v1.png', mimeType: 'image/png', buffer: png })
    await media.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByRole('status')).toContainText('Folder enviado com sucesso')

    await page.goto('/admin/cursos')
    const row = page.locator(`a[href="/admin/cursos/${courseId}"]`).locator('xpath=ancestor::tr')
    if (await row.getByRole('button', { name: 'Publicar' }).isVisible().catch(() => false)) {
      await row.getByRole('button', { name: 'Publicar' }).click()
      await expect(row.getByRole('button', { name: 'Despublicar' })).toBeVisible()
    }

    await page.goto(`/cursos/${courseSlug}`)
    const firstFolder = page.getByAltText('Folder promocional de teste')
    await expect(firstFolder).toBeVisible()
    const firstUrl = await firstFolder.getAttribute('src')

    await page.goto(`/admin/cursos/${courseId}`)
    const replacement = page.locator('article').filter({ hasText: 'Folder promocional' })
    await replacement.locator('input[type="file"]').setInputFiles({ name: 'folder-v2.png', mimeType: 'image/png', buffer: png })
    await replacement.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByRole('status')).toContainText('Folder enviado com sucesso')

    await page.goto(`/cursos/${courseSlug}`)
    await expect(page.getByAltText('Folder promocional de teste')).toBeVisible()
    await expect.poll(() => page.getByAltText('Folder promocional de teste').getAttribute('src')).not.toBe(firstUrl)
  })
})
