import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'

const required = ['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'E2E_STUDENT_EMAIL', 'E2E_STUDENT_PASSWORD', 'E2E_COURSE_ID', 'E2E_COURSE_SLUG', 'E2E_COURSE_TITLE', 'NUXT_PUBLIC_SUPABASE_URL', 'NUXT_PUBLIC_SUPABASE_KEY'] as const
const configured = required.every(key => process.env[key])
const env = (key: typeof required[number]) => process.env[key]!
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')

const login = async (page: import('@playwright/test').Page, email: string, password: string, destination: RegExp) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(destination, { timeout: 15_000 })
}

test.describe('Fase 02 autenticada no Supabase DEV', () => {
  test.skip(!configured, `Configure: ${required.join(', ')}`)

  test('DRAFT, autorização, RLS, folder, publicação e catálogos', async ({ browser }) => {
    const courseId = env('E2E_COURSE_ID')
    const slug = env('E2E_COURSE_SLUG')
    const title = env('E2E_COURSE_TITLE')
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await login(adminPage, env('E2E_ADMIN_EMAIL'), env('E2E_ADMIN_PASSWORD'), /\/admin/)

    await adminPage.goto(`/admin/cursos/${courseId}/preview`)
    await expect(adminPage.getByText('PREVIEW DO CURSO')).toBeVisible()
    await expect(adminPage.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(adminPage.getByText('Instrutor E2E')).toBeVisible()
    await expect(adminPage.getByText('Lote E2E 1')).toBeVisible()
    await expect(adminPage.getByText('Módulo E2E')).toBeVisible()
    await expect(adminPage.getByText('Aula E2E')).toBeVisible()

    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    await login(studentPage, env('E2E_STUDENT_EMAIL'), env('E2E_STUDENT_PASSWORD'), /\/aluno/)
    await studentPage.goto('/aluno/catalogo')
    await expect(studentPage.getByText(title)).toHaveCount(0)
    await studentPage.goto(`/cursos/${slug}`)
    await expect(studentPage.getByRole('heading', { level: 1, name: title })).toHaveCount(0)
    for (const path of ['/admin', '/admin/cursos', `/admin/cursos/${courseId}/preview`]) {
      await studentPage.goto(path)
      await expect(studentPage).not.toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    }

    const student = createClient(env('NUXT_PUBLIC_SUPABASE_URL'), env('NUXT_PUBLIC_SUPABASE_KEY'))
    const { error: studentLoginError } = await student.auth.signInWithPassword({ email: env('E2E_STUDENT_EMAIL'), password: env('E2E_STUDENT_PASSWORD') })
    expect(studentLoginError).toBeNull()
    const forbidden = await Promise.all([
      student.from('courses').insert({ title: 'E2E forbidden', slug: `e2e-forbidden-${Date.now()}`, short_description: '', description: '', course_type: 'ONLINE', workload_hours: 1, price: 1 }),
      student.from('courses').update({ title: 'E2E forbidden update' }).eq('id', courseId),
      student.from('courses').delete().eq('id', courseId),
      student.from('course_batches').insert({ course_id: courseId, name: 'E2E forbidden', position: 99, price: 1, max_sales: 1, status: 'DRAFT', activation_mode: 'QUANTITY' }),
      student.from('course_batches').update({ price: 1 }).eq('course_id', courseId),
      student.from('instructors').update({ active: false }).eq('id', process.env.E2E_INSTRUCTOR_ID!),
      student.storage.from('course-public-assets').upload(`courses/${courseId}/folder/student-forbidden.png`, png, { contentType: 'image/png' }),
    ])
    for (const result of forbidden) { expect(result.error).toBeTruthy() }

    await adminPage.goto(`/admin/cursos/${courseId}`)
    const media = adminPage.locator('article').filter({ hasText: 'Folder promocional' })
    await media.getByLabel('Texto alternativo').fill('Folder E2E do catálogo')
    await media.locator('input[type="file"]').setInputFiles({ name: 'e2e-folder.png', mimeType: 'image/png', buffer: png })
    await media.getByRole('button', { name: 'Enviar' }).click()
    await expect(adminPage.getByRole('status')).toContainText('Folder enviado com sucesso')
    await adminPage.goto(`/admin/cursos/${courseId}/preview`)
    await expect(adminPage.getByAltText('Folder E2E do catálogo')).toBeVisible()

    await adminPage.goto('/admin/cursos')
    const row = adminPage.locator(`a[href="/admin/cursos/${courseId}"]`).locator('xpath=ancestor::tr')
    await row.getByRole('button', { name: 'Publicar' }).click()
    await expect(row.getByRole('button', { name: 'Despublicar' })).toBeVisible()

    const admin = createClient(env('NUXT_PUBLIC_SUPABASE_URL'), env('NUXT_PUBLIC_SUPABASE_KEY'))
    const { error: adminLoginError } = await admin.auth.signInWithPassword({ email: env('E2E_ADMIN_EMAIL'), password: env('E2E_ADMIN_PASSWORD') })
    expect(adminLoginError).toBeNull()
    const { data: published } = await admin.from('courses').select('status,published_at').eq('id', courseId).single()
    expect(published?.status).toBe('PUBLISHED')
    expect(published?.published_at).toBeTruthy()

    await adminPage.goto('/cursos')
    await expect(adminPage.locator('article').filter({ hasText: title })).toBeVisible()
    await adminPage.goto(`/cursos/${slug}`)
    await expect(adminPage.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(adminPage.getByAltText('Folder E2E do catálogo')).toBeVisible()
    await expect(adminPage.getByText('Instrutor E2E')).toBeVisible()
    expect(await adminPage.locator('body').textContent()).not.toContain('video_path')
    expect(await adminPage.locator('body').textContent()).not.toContain('file_path')

    await studentPage.goto('/aluno/catalogo')
    await studentPage.getByPlaceholder('Buscar cursos...').fill(title)
    const card = studentPage.locator('article').filter({ hasText: title }).first()
    await expect(card).toBeVisible()
    await expect(card).toContainText('ONLINE')
    await card.getByRole('link', { name: 'Ver curso' }).click()
    await expect(studentPage.getByRole('heading', { level: 1, name: title })).toBeVisible()

    await adminContext.close()
    await studentContext.close()
  })
})
