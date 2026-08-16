import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'

type MaterialRow = { id: string, title: string, mime_type: string, file_size: number, file_path: string }

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
  const coverUrl = course.cover_path ? admin.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null
  return {
    enrollmentId: enrollment.id,
    course: { id: course.id, title: course.title, slug: course.slug, shortDescription: course.short_description, description: course.description, courseType: course.course_type, coverUrl },
    materials: materialItems.filter(item => item.downloadUrl),
  }
})
