import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'

type MaterialRow = { id: string, title: string, mime_type: string, file_size: number, file_path: string }
type KnowledgeImage = { id: string, file_path: string, alt_text: string, position: number }
type KnowledgeItem = { id: string, title: string, summary: string | null, content_type: 'POST' | 'PDF' | 'VIDEO', content: string | null, external_url: string | null, file_path: string | null, version: number, knowledge_item_images: KnowledgeImage[] }
type KnowledgeRow = {
  id: string
  title_override: string | null
  is_required: boolean
  is_pre_event: boolean
  due_at: string | null
  knowledge_version: number
  knowledge_items: KnowledgeItem | KnowledgeItem[] | null
  knowledge_progress: { first_viewed_at: string | null, completed_at: string | null, completed_version: number | null }[]
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const enrollmentId = z.uuid().parse(getRouterParam(event, 'enrollmentId'))
  // The enrollment check is mandatory before service-role signed URLs are created.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: enrollment, error } = await admin.from('enrollments')
    .select('id,enrolled_at,courses(id,title,slug,short_description,description,course_type,cover_path)')
    .eq('id', enrollmentId).eq('user_id', user.sub).eq('status', 'ACTIVE').single()
  if (error || !enrollment?.courses) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado na sua conta' }) }
  const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses
  const { data: materials, error: materialError } = await admin.from('course_materials')
    .select('id,title,mime_type,file_size,file_path,created_at').eq('course_id', course.id).order('created_at')
  if (materialError) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar os materiais' }) }
  const materialItems = await Promise.all(((materials ?? []) as MaterialRow[]).map(async (material) => {
    const { data } = await admin.storage.from('course-materials').createSignedUrl(material.file_path, 3600, { download: true })
    return { id: material.id, title: material.title, mimeType: material.mime_type, fileSize: material.file_size, downloadUrl: data?.signedUrl ?? null }
  }))
  const { data: knowledge, error: knowledgeError } = await admin.from('course_knowledge_items')
    .select('id,title_override,is_required,is_pre_event,due_at,knowledge_version,knowledge_items(id,title,summary,content_type,content,external_url,file_path,version,knowledge_item_images(id,file_path,alt_text,position)),knowledge_progress(first_viewed_at,completed_at,completed_version)')
    .eq('course_id', course.id).or(`available_at.is.null,available_at.lte.${new Date().toISOString()}`).eq('knowledge_progress.enrollment_id', enrollment.id).order('position')
  if (knowledgeError) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar a preparação do evento' }) }
  const preparation = await Promise.all(((knowledge ?? []) as KnowledgeRow[]).map(async (assignment) => {
    const item = Array.isArray(assignment.knowledge_items) ? assignment.knowledge_items[0] : assignment.knowledge_items
    if (!item) { return null }
    const media = item.file_path ? await admin.storage.from('knowledge-library').createSignedUrl(item.file_path, 3600) : { data: null }
    const images = await Promise.all((item.knowledge_item_images ?? []).sort((a: KnowledgeImage, b: KnowledgeImage) => a.position - b.position).map(async (image: KnowledgeImage) => {
      const { data } = await admin.storage.from('knowledge-library').createSignedUrl(image.file_path, 3600)
      return { id: image.id, altText: image.alt_text, url: data?.signedUrl ?? null }
    }))
    const progress = assignment.knowledge_progress?.[0]
    return {
      id: assignment.id, title: assignment.title_override || item.title, summary: item.summary, type: item.content_type,
      content: item.content, externalUrl: item.external_url, mediaUrl: media.data?.signedUrl ?? null,
      images: images.filter(image => image.url), required: assignment.is_required, preEvent: assignment.is_pre_event,
      dueAt: assignment.due_at, viewedAt: progress?.first_viewed_at ?? null,
      completedAt: progress?.completed_version === assignment.knowledge_version ? progress.completed_at : null,
    }
  }))
  const coverUrl = course.cover_path ? admin.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null
  return {
    enrollmentId: enrollment.id,
    course: { id: course.id, title: course.title, slug: course.slug, shortDescription: course.short_description, description: course.description, courseType: course.course_type, coverUrl },
    materials: materialItems.filter(item => item.downloadUrl), preparation: preparation.filter(Boolean),
  }
})
