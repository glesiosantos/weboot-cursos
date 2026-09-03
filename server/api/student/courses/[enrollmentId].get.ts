import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { buildCourseProgress } from '../../../utils/course-progress'

type MaterialRow = { id: string, module_id: string | null, lesson_id: string | null, title: string, mime_type: string, file_size: number, file_path: string }
type LessonRow = { id: string, module_id: string, title: string, description: string | null, lesson_type: 'VIDEO' | 'TEXT' | 'MATERIAL', content: string | null, video_path: string | null, duration_minutes: number | null, position: number, is_required: boolean }
type ModuleRow = { id: string, title: string, description: string | null, position: number }
type ProgressRow = { lesson_id: string, started_at: string | null, completed_at: string | null, updated_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signMaterial = async (admin: any, material: MaterialRow) => {
  const { data } = await admin.storage.from('course-materials').createSignedUrl(material.file_path, 900, { download: true })
  return { id: material.id, title: material.title, mimeType: material.mime_type, fileSize: material.file_size, downloadUrl: data?.signedUrl ?? null }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const enrollmentId = z.uuid().parse(getRouterParam(event, 'enrollmentId'))
  // Service-role access is used only after binding this enrollment to the authenticated user.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data: enrollment, error } = await admin.from('enrollments')
    .select('id,enrolled_at,courses(id,title,slug,short_description,description,course_type,cover_path)')
    .eq('id', enrollmentId).eq('user_id', user.sub).eq('status', 'ACTIVE').single()
  if (error || !enrollment?.courses) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado na sua conta' }) }
  const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses
  const { data: modules, error: moduleError } = await admin.from('course_modules').select('id,title,description,position').eq('course_id', course.id).order('position')
  if (moduleError) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar os módulos' }) }
  const moduleIds = ((modules ?? []) as ModuleRow[]).map(module => module.id)
  const [lessonResult, materialResult, progressResult] = await Promise.all([
    moduleIds.length
      ? admin.from('lessons').select('id,module_id,title,description,lesson_type,content,video_path,duration_minutes,position,is_required').in('module_id', moduleIds).order('position')
      : Promise.resolve({ data: [], error: null }),
    admin.from('course_materials').select('id,module_id,lesson_id,title,mime_type,file_size,file_path').eq('course_id', course.id).order('created_at'),
    admin.from('lesson_progress').select('lesson_id,started_at,completed_at,updated_at').eq('user_id', user.sub).eq('course_id', course.id),
  ])
  if (lessonResult.error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar as aulas' }) }
  if (materialResult.error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar os materiais' }) }
  if (progressResult.error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar o progresso' }) }
  const lessons = (lessonResult.data ?? []) as LessonRow[]
  const materials = (materialResult.data ?? []) as MaterialRow[]
  const progress = buildCourseProgress(lessons, (progressResult.data ?? []) as ProgressRow[])
  const signedMaterials = new Map(await Promise.all(materials.map(async material => [material.id, await signMaterial(admin, material)] as const)))
  const lessonItems = await Promise.all(lessons.map(async (lesson) => {
    let videoUrl: string | null = null
    if (lesson.video_path) {
      const { data } = await admin.storage.from('course-videos').createSignedUrl(lesson.video_path, 900)
      videoUrl = data?.signedUrl ?? null
    }
    const state = progress.byLessonId[lesson.id]
    return {
      id: lesson.id, title: lesson.title, description: lesson.description, lessonType: lesson.lesson_type,
      content: lesson.content, durationMinutes: lesson.duration_minutes, isRequired: lesson.is_required,
      videoUrl, videoAvailable: !lesson.video_path || Boolean(videoUrl), completedAt: state?.completedAt ?? null,
      materials: materials.filter(item => item.lesson_id === lesson.id).map(item => signedMaterials.get(item.id)),
    }
  }))
  const lessonById = new Map(lessonItems.map(lesson => [lesson.id, lesson]))
  const moduleItems = ((modules ?? []) as ModuleRow[]).map(module => ({
    id: module.id, title: module.title, description: module.description,
    materials: materials.filter(item => item.module_id === module.id && !item.lesson_id).map(item => signedMaterials.get(item.id)),
    lessons: lessons.filter(lesson => lesson.module_id === module.id).map(lesson => lessonById.get(lesson.id)),
  }))
  const coverUrl = course.cover_path ? admin.storage.from('course-covers').getPublicUrl(course.cover_path).data.publicUrl : null
  return {
    enrollmentId: enrollment.id,
    course: { id: course.id, title: course.title, slug: course.slug, shortDescription: course.short_description, description: course.description, courseType: course.course_type, coverUrl },
    modules: moduleItems,
    materials: materials.filter(item => !item.module_id && !item.lesson_id).map(item => signedMaterials.get(item.id)),
    progress: { completed: progress.completed, total: progress.total, percentage: progress.percentage, lastLessonId: progress.lastLessonId },
  }
})
