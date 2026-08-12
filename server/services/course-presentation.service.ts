import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

type Client = SupabaseClient<Database>
type Selector = { id: string } | { slug: string }

export const getCoursePresentation = async (client: Client, selector: Selector, preview = false) => {
  let query = client.from('courses').select('id,title,slug,short_description,description,course_type,status,workload_hours,price,promotional_price,pricing_type,show_future_batches,cover_path,folder_path,folder_alt_text,folder_mime_type,folder_original_name,program,requirements,target_audience,instructors(name,bio),course_presential_details(location_name,address,address_number,city,state,starts_at,ends_at,max_students)').is('archived_at', null)
  query = 'id' in selector ? query.eq('id', selector.id) : query.eq('slug', selector.slug)
  if (!preview) { query = query.eq('status', 'PUBLISHED') }
  const { data: course, error } = await query.single()
  if (error || !course) { return null }

  const { data: modules, error: moduleError } = course.course_type === 'ONLINE'
    ? await client.from('course_modules').select('id,title,description,position').eq('course_id', course.id).order('position')
    : { data: [], error: null }
  if (moduleError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar os módulos' }) }
  const moduleIds = (modules ?? []).map(module => module.id)
  const { data: lessons, error: lessonError } = !moduleIds.length
    ? { data: [], error: null }
    : preview
      ? await client.from('lessons').select('id,module_id,title,description,lesson_type,duration_minutes,position,is_preview').in('module_id', moduleIds).order('position')
      : await client.rpc('get_published_course_lessons', { target_course_id: course.id })
  if (lessonError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar as aulas' }) }

  let currentBatch: Database['public']['Tables']['course_batches']['Row'] | null = null
  let upcomingBatches: Array<{ id: string, name: string, position: number, price: number }> = []
  if (course.pricing_type === 'BATCHES') {
    if (preview) {
      const { data, error: batchError } = await client.from('course_batches').select('*').eq('course_id', course.id).order('position')
      if (batchError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao calcular os lotes' }) }
      const now = Date.now()
      const available = (data ?? []).filter(batch => ['ACTIVE', 'SCHEDULED'].includes(batch.status) && (!batch.starts_at || new Date(batch.starts_at).getTime() <= now) && (!batch.ends_at || new Date(batch.ends_at).getTime() > now))
      currentBatch = available.sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE') || a.position - b.position)[0] ?? null
      if (course.show_future_batches) { upcomingBatches = (data ?? []).filter(batch => batch.status === 'SCHEDULED' && Boolean(batch.starts_at) && new Date(batch.starts_at!).getTime() > now).map(batch => ({ id: batch.id, name: batch.name, position: batch.position, price: Number(batch.price) })) }
    }
    else {
      const { data, error: batchError } = await client.rpc('get_current_course_batch', { target_course_id: course.id })
      if (batchError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao calcular o preço vigente' }) }
      currentBatch = data?.[0] ?? null
      if (course.show_future_batches) {
        const { data: upcoming, error: upcomingError } = await client.rpc('get_upcoming_course_batches', { target_course_id: course.id })
        if (upcomingError) { throw createError({ statusCode: 500, statusMessage: 'Falha ao carregar os próximos lotes' }) }
        upcomingBatches = (upcoming ?? []).map(batch => ({ id: batch.id, name: batch.name, position: batch.position, price: Number(batch.price) }))
      }
    }
  }

  const instructor = Array.isArray(course.instructors) ? course.instructors[0] : course.instructors
  const presential = Array.isArray(course.course_presential_details) ? course.course_presential_details[0] : course.course_presential_details
  const coverUrl = course.cover_path ? client.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null
  const folderUrl = course.folder_path ? client.storage.from('course-public-assets').getPublicUrl(course.folder_path).data.publicUrl : null
  return {
    ...course, instructors: undefined, course_presential_details: undefined,
    instructor_name: instructor?.name ?? null, instructor_bio: instructor?.bio ?? null, presential: presential ?? null,
    workload_hours: Number(course.workload_hours), price: Number(course.price), promotional_price: course.promotional_price === null ? null : Number(course.promotional_price),
    current_batch: currentBatch ? { ...currentBatch, price: Number(currentBatch.price) } : null, upcoming_batches: upcomingBatches,
    public_price: course.pricing_type === 'BATCHES' ? (currentBatch ? Number(currentBatch.price) : null) : Number(course.promotional_price ?? course.price),
    cover_url: coverUrl, folder_url: folderUrl, cover_path: undefined, folder_path: undefined,
    modules: (modules ?? []).map(module => ({ ...module, lessons: (lessons ?? []).filter(lesson => lesson.module_id === module.id) })),
  }
}
