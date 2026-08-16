import type { Course, CourseMode } from '~/types/course'

export const filterCourses = (courses: Course[], mode: CourseMode, search: string) => courses.filter((course) => {
  const modeMatches = mode === 'TODOS' || course.course_type === mode
  const term = search.trim().toLocaleLowerCase('pt-BR')
  return modeMatches && (!term || `${course.title} ${course.short_description}`.toLocaleLowerCase('pt-BR').includes(term))
})

export const normalizeSlug = (value: string) => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatPrice = (value: number) => value === 0 ? 'Gratuito' : money.format(value)

export const formatCourseDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value))
export const formatCourseTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
