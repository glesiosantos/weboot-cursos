import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(resolve(path), 'utf8')
const adminList = source('app/pages/admin/cursos/index.vue')
const adminForm = source('app/components/admin/CourseForm.vue')
const coverUpload = source('server/api/admin/courses/[id]/cover.post.ts')
const coverDelete = source('server/api/admin/courses/[id]/cover.delete.ts')
const moduleDelete = source('server/api/admin/modules/[id].delete.ts')
const videoUpload = source('server/api/admin/lessons/[id]/video.post.ts')

describe('admin course completion contracts', () => {
  it('supports course search, modality filtering and mobile cards', () => {
    expect(adminList).toContain('admin-course-search')
    expect(adminList).toContain('modality.value === \'TODOS\'')
    expect(adminList).toContain('md:hidden')
  })

  it('validates cover content and supports independent replacement/removal', () => {
    expect(coverUpload).toContain('hasValidFolderSignature')
    expect(coverUpload.indexOf('from(\'courses\').update')).toBeLessThan(coverUpload.lastIndexOf('storage.from(\'course-covers\').remove'))
    expect(coverDelete).toContain('cover_path: null')
    expect(coverDelete).not.toContain('folder_path: null')
    expect(adminForm).toContain('removeCover')
  })

  it('removes nested private objects and replaces videos without orphaning the old file', () => {
    expect(moduleDelete).toContain('.in(\'lesson_id\', lessonIds)')
    expect(moduleDelete).toContain('storage.from(\'course-materials\').remove(files)')
    expect(videoUpload).toContain('lesson.video_path && lesson.video_path !== path')
  })
})
