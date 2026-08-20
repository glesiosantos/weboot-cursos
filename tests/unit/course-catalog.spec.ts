import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseCard from '../../app/components/CourseCard.vue'
import FeaturedCourses from '../../app/components/FeaturedCourses.vue'
import type { Course } from '../../app/types/course'

const published: Course = { id: '1', title: 'Curso publicado', slug: 'publicado', short_description: 'Visível no catálogo', course_type: 'ONLINE', workload_hours: 20, price: 397, promotional_price: null, cover_url: null, instructor_name: null }
const visibleText = (text: string) => text.replaceAll('\u00a0', ' ')

describe('public course catalog', () => {
  it('renders the published result returned by the public query', async () => {
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published] } })
    expect(wrapper.text()).toContain('Curso publicado')
  })

  it('does not render a draft excluded by the public query', async () => {
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published] } })
    expect(wrapper.text()).not.toContain('Curso interno em revisão')
  })

  it('filters the featured courses by search and modality', async () => {
    const presential: Course = { ...published, id: '2', title: 'Workshop presencial', slug: 'workshop-presencial', course_type: 'PRESENCIAL' }
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published, presential] } })

    await wrapper.get('input[type="search"]').setValue('workshop')
    expect(wrapper.text()).toContain('Workshop presencial')
    expect(wrapper.text()).not.toContain('Curso publicado')

    await wrapper.get('input[type="search"]').setValue('')
    const onlineTab = wrapper.findAll('[role="tab"]').find(tab => tab.text() === 'Online')
    expect(onlineTab).toBeDefined()
    await onlineTab!.trigger('click')
    expect(wrapper.text()).toContain('Curso publicado')
    expect(wrapper.text()).not.toContain('Workshop presencial')
  })

  it('links the catalog and course calls to action to public routes', async () => {
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published] } })
    expect(wrapper.find(`a[href="/cursos/${published.slug}"]`).exists()).toBe(true)
    expect(wrapper.find('a[href="/cursos"]').exists()).toBe(true)
  })

  it('renders fixed and current-batch prices with distinct labels', async () => {
    const fixed = await mountSuspended(CourseCard, { props: { course: { ...published, pricing_type: 'FIXED', promotional_price: 297, public_price: 297 } } })
    expect(visibleText(fixed.text())).toContain('R$ 397,00')
    expect(visibleText(fixed.text())).toContain('R$ 297,00')
    expect(fixed.text()).not.toContain('A partir de')

    const batches = await mountSuspended(CourseCard, { props: { course: { ...published, pricing_type: 'BATCHES', public_price: 99.9 } } })
    expect(batches.text()).toContain('A partir de')
    expect(visibleText(batches.text())).toContain('R$ 99,90')
    expect(visibleText(batches.text())).not.toContain('R$ 397,00')
  })

  it('does not reuse the fixed price when no current batch exists', async () => {
    const wrapper = await mountSuspended(CourseCard, { props: { course: { ...published, pricing_type: 'BATCHES', public_price: null } } })
    expect(wrapper.text()).toContain('Lotes indisponíveis')
    expect(visibleText(wrapper.text())).not.toContain('R$ 397,00')
  })
})
