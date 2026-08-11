import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FeaturedCourses from '../../app/components/FeaturedCourses.vue'
import type { Course } from '../../app/types/course'

const published: Course = { id: '1', title: 'Curso publicado', slug: 'publicado', short_description: 'Visível no catálogo', course_type: 'ONLINE', workload_hours: 20, price: 397, promotional_price: null, cover_url: null, instructor_name: null }

describe('public course catalog', () => {
  it('renders the published result returned by the public query', async () => {
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published] } })
    expect(wrapper.text()).toContain('Curso publicado')
  })

  it('does not render a draft excluded by the public query', async () => {
    const wrapper = await mountSuspended(FeaturedCourses, { props: { courses: [published] } })
    expect(wrapper.text()).not.toContain('Curso interno em revisão')
  })
})
