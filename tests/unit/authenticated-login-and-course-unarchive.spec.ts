import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')

describe('authenticated login and archived course flows', () => {
  it('redirects authenticated visitors away from login according to their account', () => {
    expect(source('app/pages/login.vue')).toContain('definePageMeta({ middleware: \'guest\' })')
    const middleware = source('app/middleware/guest.ts')
    expect(middleware).toContain('resolveAuthenticatedUserId()')
    expect(middleware).toContain('navigateTo(\'/primeiro-acesso\')')
    expect(middleware).toContain('getAuthenticatedHome(profile?.role)')
  })

  it('offers unarchive instead of publish for archived courses', () => {
    const listing = source('app/pages/admin/cursos/index.vue')
    expect(listing).toContain('name: \'publish\' | \'unpublish\' | \'archive\' | \'unarchive\' | \'duplicate\'')
    expect(listing).toContain('label="Desarquivar curso"')
    expect(listing).toContain('@click="action(course.id, \'unarchive\')"')
  })

  it('clears archived_at through an admin-only endpoint', () => {
    const endpoint = source('server/api/admin/courses/[id]/unarchive.post.ts')
    expect(endpoint).toContain('requireRole(event, [\'ADMIN\'])')
    expect(endpoint).toContain('update({ archived_at: null })')
  })
})
