import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')
const migration = source('supabase/migrations/20260825000200_knowledge_library_and_pre_event_progress.sql')

describe('reusable knowledge library', () => {
  it('separates reusable content, course assignment and per-enrollment progress', () => {
    expect(migration).toContain('create table public.knowledge_items')
    expect(migration).toContain('create table public.course_knowledge_items')
    expect(migration).toContain('create table public.knowledge_progress')
    expect(migration).toContain('unique(enrollment_id, course_knowledge_item_id)')
  })

  it('supports posts, private PDFs and videos with versioned course assignments', () => {
    expect(migration).toContain('(\'POST\', \'PDF\', \'VIDEO\')')
    expect(migration).toContain('(\'knowledge-library\', \'knowledge-library\', false')
    expect(migration).toContain('knowledge_version integer not null')
    expect(migration).toContain('completed_version integer')
  })

  it('validates active enrollment before recording completion', () => {
    expect(migration).toContain('e.user_id = (select auth.uid()) and e.status = \'ACTIVE\'')
    expect(migration).toContain('ki.status = \'PUBLISHED\'')
    expect(migration).toContain('grant execute on function public.register_knowledge_progress')
  })

  it('keeps student assets behind signed URLs', () => {
    const studentApi = source('server/api/student/courses/[enrollmentId].get.ts')
    expect(studentApi).toContain('storage.from(\'knowledge-library\').createSignedUrl')
    expect(studentApi).toContain('.eq(\'id\', enrollmentId).eq(\'user_id\', user.sub).eq(\'status\', \'ACTIVE\')')
  })

  it('shows preparation progress in the course participant dashboard', () => {
    const participantApi = source('server/api/admin/courses/[id]/participants.get.ts')
    const participantPage = source('app/pages/admin/cursos/[id]/inscritos.vue')
    expect(participantApi).toContain('from(\'knowledge_progress\')')
    expect(participantPage).toContain('item.preparation.completed')
  })
})
