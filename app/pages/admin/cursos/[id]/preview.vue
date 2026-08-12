<script setup lang="ts">
import CoursePresentation from '~/components/course/CoursePresentation.vue'
import type { Course } from '~/types/course'

definePageMeta({ layout: false, middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Preview do curso | Administração', robots: 'noindex, nofollow' })
const route = useRoute()
const id = String(route.params.id)
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const publishing = ref(false)
const publishError = ref('')
const { data: course, refresh } = await useFetch<Course>(`/api/admin/courses/${id}/preview`)
if (!course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
const width = computed(() => ({ desktop: '1280px', tablet: '768px', mobile: '390px' })[viewport.value])
const publish = async () => {
  publishing.value = true; publishError.value = ''
  try { await $fetch(`/api/admin/courses/${id}/publish`, { method: 'POST' }); await refresh() }
  catch (error) { publishError.value = error instanceof Error ? error.message : 'Não foi possível publicar o curso.' }
  finally { publishing.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="sticky top-0 z-40 border-b border-amber-200 bg-amber-50/95 px-4 py-3 backdrop-blur">
      <div class="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-wider text-amber-900">
            Preview do curso
          </p><p class="text-sm text-amber-900">
            {{ course?.status === 'PUBLISHED' ? 'Este curso já está publicado.' : 'Este curso ainda não está publicado.' }}
          </p>
        </div><div class="flex flex-wrap gap-2">
          <AppButton
            :to="`/admin/cursos/${id}`"
            variant="secondary"
          >
            Voltar para edição
          </AppButton><AppButton
            v-if="course?.status !== 'PUBLISHED'"
            :disabled="publishing"
            @click="publish"
          >
            {{ publishing ? 'Publicando…' : 'Publicar curso' }}
          </AppButton>
        </div>
      </div>
    </header><div class="border-b border-border bg-white px-4 py-3">
      <div
        class="mx-auto flex max-w-screen-xl items-center justify-center gap-2"
        aria-label="Largura do preview"
      >
        <button
          v-for="option in (['desktop', 'tablet', 'mobile'] as const)"
          :key="option"
          type="button"
          class="rounded-lg border px-4 py-2 text-sm font-bold capitalize"
          :class="viewport === option ? 'border-primary bg-primary text-white' : 'border-border'"
          @click="viewport = option"
        >
          {{ option }}
        </button><a
          :href="`/admin/cursos/${id}/preview`"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-2 text-sm font-bold text-primary underline"
        >Abrir em nova aba</a>
      </div>
    </div><p
      v-if="publishError"
      role="alert"
      class="mx-auto mt-4 max-w-screen-lg rounded-xl bg-red-50 p-4 text-danger"
    >
      {{ publishError }}
    </p><div
      class="mx-auto overflow-x-hidden px-3 transition-[max-width] duration-300"
      :style="{ maxWidth: width }"
    >
      <CoursePresentation
        v-if="course"
        :course="course"
        mode="preview"
        :preview-viewport="viewport"
      />
    </div>
  </div>
</template>
