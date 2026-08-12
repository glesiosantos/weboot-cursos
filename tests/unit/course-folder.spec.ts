import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { courseSchema, folderUploadSchema, hasValidFolderSignature } from '../../server/utils/course-validation'

const migration = readFileSync(resolve('supabase/migrations/20260811000500_course_promotional_folder.sql'), 'utf8')
const uploadRoute = readFileSync(resolve('server/api/admin/courses/[id]/folder.post.ts'), 'utf8')
const deleteRoute = readFileSync(resolve('server/api/admin/courses/[id]/folder.delete.ts'), 'utf8')
const publicRoute = readFileSync(resolve('server/api/courses/[slug].get.ts'), 'utf8')
const presentationService = readFileSync(resolve('server/services/course-presentation.service.ts'), 'utf8')
const detailPage = readFileSync(resolve('app/components/course/CoursePresentation.vue'), 'utf8')
const adminForm = readFileSync(resolve('app/components/admin/CourseForm.vue'), 'utf8')
const baseCourse = { title: 'Curso', slug: 'curso', short_description: '', description: '', course_type: 'ONLINE', workload_hours: 1, price: 0, status: 'DRAFT' }

describe('course promotional folder', () => {
  it('keeps the folder optional and separate from the cover', () => {
    expect(courseSchema.safeParse(baseCourse).success).toBe(true)
    expect(migration).toContain('add column folder_path text')
    expect(migration).not.toContain('add column folder_path text not null')
    expect(publicRoute).toContain('getCoursePresentation')
    expect(presentationService).toContain('storage.from(\'course-covers\')')
    expect(presentationService).toContain('storage.from(\'course-public-assets\')')
  })

  it('accepts valid image and PDF metadata with their independent limits', () => {
    expect(folderUploadSchema.safeParse({ type: 'image/jpeg', size: 10 * 1024 * 1024, filename: 'folder.jpeg' }).success).toBe(true)
    expect(folderUploadSchema.safeParse({ type: 'application/pdf', size: 15 * 1024 * 1024, filename: 'folder.pdf' }).success).toBe(true)
    expect(folderUploadSchema.safeParse({ type: 'image/png', size: 10 * 1024 * 1024 + 1, filename: 'folder.png' }).success).toBe(false)
    expect(folderUploadSchema.safeParse({ type: 'application/pdf', size: 15 * 1024 * 1024 + 1, filename: 'folder.pdf' }).success).toBe(false)
    expect(folderUploadSchema.safeParse({ type: 'image/png', size: 100, filename: 'folder.pdf' }).success).toBe(false)
  })

  it('rejects forged content and accepts real file signatures', () => {
    expect(hasValidFolderSignature('image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe(true)
    expect(hasValidFolderSignature('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true)
    expect(hasValidFolderSignature('image/webp', new TextEncoder().encode('RIFF0000WEBP'))).toBe(true)
    expect(hasValidFolderSignature('application/pdf', new TextEncoder().encode('%PDF-1.7'))).toBe(true)
    expect(hasValidFolderSignature('application/pdf', new TextEncoder().encode('<html>'))).toBe(false)
  })

  it('allows public reads but reserves every storage write for admins', () => {
    expect(migration).toContain('public_assets_read on storage.objects for select to anon, authenticated')
    expect(migration).toContain('c.folder_path = name and c.status = \'PUBLISHED\'')
    expect(migration).toContain('public_assets_admin_insert on storage.objects for insert to authenticated')
    expect(migration).toContain('public_assets_admin_update on storage.objects for update to authenticated')
    expect(migration).toContain('public_assets_admin_delete on storage.objects for delete to authenticated')
    expect(migration.match(/public\.is_admin\(\)/g)?.length).toBeGreaterThanOrEqual(4)
    expect(uploadRoute).toContain('requireRole(event, [\'ADMIN\'])')
    expect(deleteRoute).toContain('requireRole(event, [\'ADMIN\'])')
  })

  it('uploads before changing the reference and deletes the old object last', () => {
    const upload = uploadRoute.indexOf('storage.from(\'course-public-assets\').upload')
    const persist = uploadRoute.indexOf('from(\'courses\').update')
    const removeOld = uploadRoute.lastIndexOf('storage.from(\'course-public-assets\').remove')
    expect(upload).toBeGreaterThan(-1)
    expect(persist).toBeGreaterThan(upload)
    expect(removeOld).toBeGreaterThan(persist)
  })

  it('removes only folder metadata and never changes the cover', () => {
    expect(deleteRoute).toContain('folder_path: null')
    expect(deleteRoute).not.toContain('cover_path: null')
    expect(deleteRoute).not.toContain('storage.from(\'course-covers\').remove')
  })

  it('renders image/PDF previews and a mobile-safe public modal', () => {
    expect(adminForm).toContain('Folder em PDF')
    expect(adminForm).toContain('Para melhor resultado, utilize uma arte vertical')
    expect(detailPage).toContain('Material de divulgação')
    expect(detailPage).toContain('Ver folder em PDF')
    expect(detailPage).toContain('w-full')
    expect(detailPage).toContain('overflow-y-auto')
    expect(detailPage).toContain('folder_alt_text')
  })
})
