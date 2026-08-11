import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { slugSchema } from '../../utils/course-validation'

export default defineEventHandler(async (event) => {
  const parsed = slugSchema.safeParse(getRouterParam(event, 'slug'))
  if (!parsed.success) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const client = await serverSupabaseClient<Database>(event)
  const { data: course, error } = await client.from('courses').select('id,title,slug,short_description,description,course_type,workload_hours,price,promotional_price,pricing_type,cover_path,program,requirements,target_audience,instructors(name,bio),course_presential_details(location_name,address,address_number,city,state,starts_at,ends_at,max_students)').eq('slug', parsed.data).eq('status', 'PUBLISHED').is('archived_at', null).single()
  if (error || !course) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
  const { data: modules, error: moduleError } = course.course_type === 'ONLINE'
    ? await client.from('course_modules').select('id,title,description,position').eq('course_id', course.id).order('position')
    : { data: [], error: null }
  if (moduleError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar o programa' }) }
  const moduleIds = (modules ?? []).map(module => module.id)
  const { data: lessons, error: lessonError } = moduleIds.length
    ? await client.rpc('get_published_course_lessons', { target_course_id: course.id })
    : { data: [], error: null }
  if (lessonError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar as aulas' }) }
  const { data: batches, error: batchError } = course.pricing_type === 'BATCHES' ? await client.rpc('get_current_course_batch', { target_course_id: course.id }) : { data: [], error: null }
  if (batchError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao calcular o preço vigente' }) }
  const currentBatch = batches?.[0] ?? null
  const coverUrl = course.cover_path ? client.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null
  const instructor = Array.isArray(course.instructors) ? course.instructors[0] : course.instructors
  const presential = Array.isArray(course.course_presential_details) ? course.course_presential_details[0] : course.course_presential_details
  return { ...course, instructors: undefined, course_presential_details: undefined, instructor_name: instructor?.name ?? null, instructor_bio: instructor?.bio ?? null, presential: presential ?? null, workload_hours: Number(course.workload_hours), price: Number(course.price), promotional_price: course.promotional_price === null ? null : Number(course.promotional_price), current_batch: currentBatch ? { ...currentBatch, price: Number(currentBatch.price) } : null, public_price: course.pricing_type === 'BATCHES' ? (currentBatch ? Number(currentBatch.price) : null) : Number(course.promotional_price ?? course.price), cover_url: coverUrl, cover_path: undefined, modules: (modules ?? []).map(module => ({ ...module, lessons: (lessons ?? []).filter(lesson => lesson.module_id === module.id) })) }
})
