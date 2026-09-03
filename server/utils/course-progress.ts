type Lesson = { id: string, is_required: boolean }
type Progress = { lesson_id: string, started_at: string | null, completed_at: string | null, updated_at: string }

export const buildCourseProgress = (lessons: Lesson[], rows: Progress[]) => {
  const byLessonId = Object.fromEntries(rows.map(row => [row.lesson_id, {
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  }]))
  const required = lessons.filter(lesson => lesson.is_required)
  const completed = required.filter(lesson => Boolean(byLessonId[lesson.id]?.completedAt)).length
  const lessonIds = new Set(lessons.map(lesson => lesson.id))
  const last = [...rows].filter(row => lessonIds.has(row.lesson_id))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0]
  return {
    byLessonId,
    completed,
    total: required.length,
    percentage: required.length ? Math.round((completed / required.length) * 100) : 0,
    lastLessonId: last?.lesson_id ?? lessons[0]?.id ?? null,
  }
}
