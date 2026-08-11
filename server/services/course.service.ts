import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { normalizeSlug } from '~/utils/course'

type Client = SupabaseClient<Database>
type CourseInput = Database['public']['Tables']['courses']['Insert']
type PresentialInput = Database['public']['Tables']['course_presential_details']['Insert']

const fail = (message: string, statusCode = 400): never => { throw createError({ statusCode, statusMessage: message }) }

export const uniqueCourseSlug = async (client: Client, requested: string, exceptId?: string) => {
  const base = normalizeSlug(requested)
  if (!base) { fail('Slug inválido') }
  for (let suffix = 1; suffix < 1000; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`
    let query = client.from('courses').select('id').eq('slug', candidate)
    if (exceptId) { query = query.neq('id', exceptId) }
    const { data, error } = await query.maybeSingle()
    if (error) { fail(error.message, 500) }
    if (!data) { return candidate }
  }
  return fail('Não foi possível gerar um slug único', 409)
}

export const saveCourse = async (client: Client, values: CourseInput, presential?: PresentialInput | null, id?: string) => {
  const slug = await uniqueCourseSlug(client, values.slug, id)
  const payload = { ...values, slug }
  const result = id
    ? await client.from('courses').update(payload).eq('id', id).select().single()
    : await client.from('courses').insert(payload).select().single()
  if (result.error || !result.data) { fail(result.error?.message ?? 'Falha ao salvar curso') }
  const course = result.data!
  if (course.course_type === 'PRESENCIAL' && presential) {
    const { error } = await client.from('course_presential_details').upsert({ ...presential, course_id: course.id })
    if (error) { fail(error.message) }
  }
  else if (id) {
    const { error } = await client.from('course_presential_details').delete().eq('course_id', course.id)
    if (error) { fail(error.message) }
  }
  return course
}

export const publicationIssues = async (client: Client, id: string) => {
  const { data: course, error } = await client.from('courses').select('*').eq('id', id).single()
  if (error || !course) { fail('Curso não encontrado', 404) }
  const issues: string[] = []
  const validCourse = course!
  if (!validCourse.title.trim()) { issues.push('Título') }
  if (!validCourse.slug.trim()) { issues.push('Slug') }
  if (!validCourse.description.trim()) { issues.push('Descrição') }
  if (!validCourse.instructor_id) { issues.push('Instrutor') }
  if (validCourse.workload_hours <= 0) { issues.push('Carga horária') }
  if (validCourse.price < 0) { issues.push('Preço') }
  if (validCourse.course_type === 'PRESENCIAL') {
    const { data } = await client.from('course_presential_details').select('course_id').eq('course_id', id).maybeSingle()
    if (!data) { issues.push('Local, datas e capacidade') }
  }
  else {
    const { data: modules } = await client.from('course_modules').select('id').eq('course_id', id)
    if (!modules?.length) { issues.push('Ao menos um módulo') }
    else {
      const { count } = await client.from('lessons').select('id', { count: 'exact', head: true }).in('module_id', modules.map(module => module.id))
      if (!count) { issues.push('Ao menos uma aula') }
    }
  }
  return issues
}

export const duplicateCourse = async (client: Client, id: string) => {
  const { data: source, error } = await client.from('courses').select('*').eq('id', id).single()
  if (error || !source) { fail('Curso não encontrado', 404) }
  const validSource = source!
  const { id: _id, created_at: _created, updated_at: _updated, published_at: _published, archived_at: _archived, ...copy } = validSource
  const slug = await uniqueCourseSlug(client, `${validSource.slug}-copia`)
  const { data: created, error: createErrorValue } = await client.from('courses').insert({ ...copy, title: `${validSource.title} (cópia)`, slug, status: 'DRAFT' }).select().single()
  if (createErrorValue || !created) { fail(createErrorValue?.message ?? 'Falha ao duplicar') }
  const validCreated = created!
  if (validSource.course_type === 'PRESENCIAL') {
    const { data } = await client.from('course_presential_details').select('*').eq('course_id', id).maybeSingle()
    if (data) {
      const { created_at: _c, updated_at: _u, ...details } = data
      const { error: detailError } = await client.from('course_presential_details').insert({ ...details, course_id: validCreated.id })
      if (detailError) { fail(detailError.message) }
    }
  }
  else {
    const { data: modules } = await client.from('course_modules').select('*,lessons(*)').eq('course_id', id).order('position')
    for (const module of modules ?? []) {
      const { lessons, id: _moduleId, created_at: _c, updated_at: _u, ...moduleCopy } = module
      const { data: newModule, error: moduleError } = await client.from('course_modules').insert({ ...moduleCopy, course_id: validCreated.id }).select().single()
      if (moduleError || !newModule) { fail(moduleError?.message ?? 'Falha ao duplicar módulo') }
      for (const lesson of lessons ?? []) {
        const { id: _lessonId, created_at: _lc, updated_at: _lu, ...lessonCopy } = lesson
        const { error: lessonError } = await client.from('lessons').insert({ ...lessonCopy, module_id: newModule!.id })
        if (lessonError) { fail(lessonError.message) }
      }
    }
  }
  return validCreated
}
