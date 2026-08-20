import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const service = readFileSync('server/services/course.service.ts', 'utf8')

describe('course publication issues', () => {
  it('identifies every module that has no lessons', () => {
    expect(service).toContain('select(\'id,title,position\')')
    expect(service).toContain('Ao menos uma aula no módulo ${index + 1} — ${module.title}')
    expect(service).toContain('modules.forEach((module, index) =>')
  })

  it('does not report an access/query failure as a missing module', () => {
    expect(service).toContain('if (moduleError) { fail(moduleError.message, 500) }')
    expect(service).toContain('if (lessonError) { fail(lessonError.message, 500) }')
  })
})
