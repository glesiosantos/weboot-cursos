<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type Material = { id: string, title: string, mimeType: string, fileSize: number, downloadUrl: string | null }
type Lesson = { id: string, title: string, description: string | null, lessonType: 'VIDEO' | 'TEXT' | 'MATERIAL', content: string | null, durationMinutes: number | null, isRequired: boolean, videoUrl: string | null, videoAvailable: boolean, completedAt: string | null, materials: Material[] }
type CourseAccess = {
  enrollmentId: string
  course: { id: string, title: string, slug: string, shortDescription: string, description: string | null, courseType: string, coverUrl: string | null }
  modules: { id: string, title: string, description: string | null, materials: Material[], lessons: Lesson[] }[]
  materials: Material[]
  progress: { completed: number, total: number, percentage: number, lastLessonId: string | null }
}
const route = useRoute()
const router = useRouter()
const enrollmentId = String(route.params.enrollmentId)
const { data, error, refresh } = await useFetch<CourseAccess>(`/api/student/courses/${enrollmentId}`)
if (error.value || !data.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado na sua conta' }) }
const lessons = computed(() => data.value?.modules.flatMap(module => module.lessons) ?? [])
const requestedLessonId = computed(() => typeof route.query.aula === 'string' ? route.query.aula : null)
const selectedLesson = computed(() => lessons.value.find(lesson => lesson.id === requestedLessonId.value)
  ?? lessons.value.find(lesson => lesson.id === data.value?.progress.lastLessonId)
  ?? lessons.value[0] ?? null)
const saving = ref(false)
const feedback = ref('')
const openedLessonId = ref<string | null>(null)
const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
const fileLabel = (mime: string) => ({ 'application/pdf': 'PDF', 'application/zip': 'ZIP', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX' }[mime] ?? 'Arquivo')
const saveProgress = async (lessonId: string, action: 'START' | 'COMPLETE' | 'UNCOMPLETE', reload = true) => {
  saving.value = true
  feedback.value = ''
  try {
    await $fetch(`/api/student/courses/${enrollmentId}/progress`, { method: 'PUT', body: { lessonId, action } })
    if (reload) { await refresh() }
  }
  catch (cause) {
    feedback.value = cause instanceof Error ? cause.message : 'Não foi possível salvar seu progresso.'
  }
  finally { saving.value = false }
}
const openLesson = async (lesson: Lesson) => {
  await router.replace({ query: { ...route.query, aula: lesson.id } })
}
onMounted(() => watch(selectedLesson, async (lesson) => {
  if (!lesson || openedLessonId.value === lesson.id) { return }
  openedLessonId.value = lesson.id
  await saveProgress(lesson.id, 'START', false)
}, { immediate: true }))
useSeoMeta({ title: () => `${data.value?.course.title ?? 'Curso'} | Área do aluno`, robots: 'noindex, nofollow' })
</script>

<template>
  <section>
    <NuxtLink
      to="/aluno/cursos"
      class="text-sm font-bold text-primary-700"
    >← Meus cursos</NuxtLink>
    <header class="mt-5 overflow-hidden rounded-card border border-border bg-white sm:flex">
      <div class="aspect-video bg-primary-50 sm:w-52 sm:shrink-0">
        <img
          v-if="data?.course.coverUrl"
          :src="data.course.coverUrl"
          :alt="`Capa do curso ${data.course.title}`"
          class="h-full w-full object-cover"
        >
        <div
          v-else
          class="flex h-full items-center justify-center text-sm font-bold text-primary-700"
        >
          WEBOOT CURSOS
        </div>
      </div>
      <div class="flex-1 p-5 sm:p-6">
        <AppBadge>{{ data?.course.courseType }}</AppBadge>
        <h1 class="mt-3 text-2xl font-black sm:text-3xl">
          {{ data?.course.title }}
        </h1>
        <p class="mt-2 text-muted">
          {{ data?.course.shortDescription }}
        </p>
        <div class="mt-5 flex items-center justify-between gap-4 text-sm">
          <b>{{ data?.progress.percentage }}% concluído</b><span class="text-muted">{{ data?.progress.completed }}/{{ data?.progress.total }} aulas obrigatórias</span>
        </div>
        <div
          class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          :aria-valuenow="data?.progress.percentage"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progresso do curso"
        >
          <div
            class="h-full rounded-full bg-primary-600 transition-all"
            :style="{ width: `${data?.progress.percentage ?? 0}%` }"
          />
        </div>
      </div>
    </header>

    <div
      v-if="lessons.length"
      class="mt-8 grid gap-6 lg:grid-cols-[minmax(240px,0.34fr)_minmax(0,1fr)]"
    >
      <aside class="self-start rounded-card border border-border bg-white p-4 lg:sticky lg:top-6">
        <p class="px-2 text-xs font-black uppercase tracking-wide text-primary-700">
          Conteúdo do curso
        </p>
        <section
          v-for="module in data?.modules"
          :key="module.id"
          class="mt-4"
        >
          <h2 class="px-2 font-black">
            {{ module.title }}
          </h2>
          <button
            v-for="(lesson, index) in module.lessons"
            :key="lesson.id"
            type="button"
            class="mt-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition"
            :class="selectedLesson?.id === lesson.id ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:bg-slate-50'"
            @click="openLesson(lesson)"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
              :class="lesson.completedAt ? 'bg-primary-600 text-white' : 'bg-slate-100 text-muted'"
            >{{ lesson.completedAt ? '✓' : index + 1 }}</span>
            <span class="min-w-0"><b class="block truncate">{{ lesson.title }}</b><small
              v-if="lesson.durationMinutes"
              class="text-muted"
            >{{ lesson.durationMinutes }} min</small></span>
          </button>
        </section>
      </aside>

      <main
        v-if="selectedLesson"
        class="min-w-0 rounded-card border border-border bg-white p-5 sm:p-8"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AppBadge>{{ selectedLesson.lessonType }}</AppBadge><h2 class="mt-3 text-2xl font-black">
              {{ selectedLesson.title }}
            </h2><p
              v-if="selectedLesson.description"
              class="mt-2 text-muted"
            >
              {{ selectedLesson.description }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-xl border border-primary-600 px-4 py-2 text-sm font-bold text-primary-700 disabled:opacity-50"
            :disabled="saving"
            @click="saveProgress(selectedLesson.id, selectedLesson.completedAt ? 'UNCOMPLETE' : 'COMPLETE')"
          >
            {{ selectedLesson.completedAt ? 'Marcar como não concluída' : 'Concluir aula' }}
          </button>
        </div>
        <p
          v-if="feedback"
          role="alert"
          class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {{ feedback }}
        </p>
        <div
          v-if="selectedLesson.lessonType === 'VIDEO'"
          class="mt-6"
        >
          <video
            v-if="selectedLesson.videoUrl"
            :key="selectedLesson.videoUrl"
            :src="selectedLesson.videoUrl"
            controls
            playsinline
            class="aspect-video w-full rounded-xl bg-black"
          >Seu navegador não suporta a reprodução deste vídeo.</video>
          <p
            v-else
            class="rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center text-muted"
          >
            {{ selectedLesson.videoAvailable ? 'Esta aula ainda não possui vídeo.' : 'O vídeo está temporariamente indisponível. Atualize a página para tentar novamente.' }}
          </p>
        </div>
        <div
          v-if="selectedLesson.content"
          class="mt-6 whitespace-pre-wrap leading-7"
        >
          {{ selectedLesson.content }}
        </div>
        <p
          v-else-if="selectedLesson.lessonType === 'TEXT'"
          class="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-muted"
        >
          O conteúdo desta aula ainda não foi disponibilizado.
        </p>
        <section
          v-if="selectedLesson.materials.length"
          class="mt-8 border-t border-border pt-6"
        >
          <h3 class="font-black">
            Materiais desta aula
          </h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <a
              v-for="material in selectedLesson.materials"
              :key="material.id"
              :href="material.downloadUrl || undefined"
              :aria-disabled="!material.downloadUrl"
              class="rounded-xl border border-border p-4"
              :class="material.downloadUrl ? 'hover:border-primary-400' : 'cursor-not-allowed opacity-60'"
            ><b class="block">{{ material.title }}</b><span class="text-sm text-muted">{{ fileLabel(material.mimeType) }} · {{ fileSize(material.fileSize) }}<template v-if="!material.downloadUrl"> · indisponível</template></span></a>
          </div>
        </section>
      </main>
    </div>
    <div
      v-else
      class="mt-8 rounded-card border border-dashed border-border bg-white p-10 text-center"
    >
      <h2 class="text-xl font-black">
        Nenhuma aula disponível
      </h2><p class="mt-2 text-muted">
        O conteúdo deste curso ainda está sendo preparado.
      </p>
    </div>

    <section
      v-if="data?.materials.length"
      class="mt-8"
    >
      <h2 class="text-2xl font-black">
        Materiais gerais
      </h2><div class="mt-4 grid gap-4 md:grid-cols-2">
        <a
          v-for="material in data.materials"
          :key="material.id"
          :href="material.downloadUrl || undefined"
          class="rounded-card border border-border bg-white p-5"
        ><b>{{ material.title }}</b><p class="mt-1 text-sm text-muted">{{ fileLabel(material.mimeType) }} · {{ fileSize(material.fileSize) }}</p></a>
      </div>
    </section>
  </section>
</template>
