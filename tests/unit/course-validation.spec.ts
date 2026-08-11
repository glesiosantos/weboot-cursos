import { describe, expect, it } from 'vitest'
import { courseSchema, presentialDetailsSchema } from '../../server/utils/course-validation'
import { formatPrice, normalizeSlug } from '../../app/utils/course'

const valid = { title: 'Curso', slug: 'curso', short_description: 'Resumo', description: 'Descrição', course_type: 'ONLINE', instructor_id: '10000000-0000-4000-8000-000000000001', workload_hours: 10, price: 100, status: 'DRAFT' }

describe('course validation', () => {
  it('normalizes safe slugs and formats free courses', () => { expect(normalizeSlug('Destravando SQL!')).toBe('destravando-sql'); expect(formatPrice(0)).toBe('Gratuito') })
  it('requires a title', () => expect(courseSchema.safeParse({ ...valid, title: '' }).success).toBe(false))
  it('rejects invalid type, price and workload', () => {
    expect(courseSchema.safeParse({ ...valid, course_type: 'HIBRIDO' }).success).toBe(false)
    expect(courseSchema.safeParse({ ...valid, price: -1 }).success).toBe(false)
    expect(courseSchema.safeParse({ ...valid, workload_hours: 0 }).success).toBe(false)
  })
  it('rejects a promotional price above price', () => expect(courseSchema.safeParse({ ...valid, promotional_price: 101 }).success).toBe(false))
  it('requires publication fields', () => expect(courseSchema.safeParse({ ...valid, status: 'PUBLISHED', description: '', instructor_id: null }).success).toBe(false))
  it('validates presential dates and capacity', () => {
    const details = { location_name: 'Local', city: 'São Paulo', state: 'SP', starts_at: '2026-10-17T12:00:00.000Z', ends_at: '2026-10-17T10:00:00.000Z', registration_deadline: '2026-10-18T12:00:00.000Z', max_students: 0 }
    expect(presentialDetailsSchema.safeParse(details).success).toBe(false)
  })
})
