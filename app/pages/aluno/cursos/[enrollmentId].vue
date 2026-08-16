<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type CourseAccess = {
  enrollmentId: string
  course: { id: string, title: string, slug: string, shortDescription: string, description: string | null, courseType: string, coverUrl: string | null }
  materials: { id: string, title: string, mimeType: string, fileSize: number, downloadUrl: string }[]
}
const route = useRoute()
const { data, error } = await useFetch<CourseAccess>(`/api/student/courses/${String(route.params.enrollmentId)}`)
if (error.value || !data.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado na sua conta' }) }
const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
const fileLabel = (mime: string) => ({ 'application/pdf': 'PDF', 'application/zip': 'ZIP', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX' }[mime] ?? 'Arquivo')
useSeoMeta({ title: () => `${data.value?.course.title ?? 'Curso'} | Área do aluno`, robots: 'noindex, nofollow' })
</script>

<template>
  <section>
    <NuxtLink
      to="/aluno/cursos"
      class="text-sm font-bold text-primary-700"
    >← Meus cursos</NuxtLink>
    <div class="mt-5 overflow-hidden rounded-card border border-border bg-white lg:grid lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
      <div class="aspect-video bg-primary-50 lg:aspect-auto">
        <img
          v-if="data?.course.coverUrl"
          :src="data.course.coverUrl"
          :alt="`Capa do curso ${data.course.title}`"
          class="h-full w-full object-cover"
        ><div
          v-else
          class="flex h-full min-h-56 items-center justify-center text-sm font-bold text-primary-700"
        >
          WEBOOT CURSOS
        </div>
      </div>
      <div class="p-6 sm:p-8">
        <AppBadge>{{ data?.course.courseType }}</AppBadge><h1 class="mt-4 text-3xl font-black">
          {{ data?.course.title }}
        </h1><p class="mt-3 text-muted">
          {{ data?.course.shortDescription }}
        </p><p
          v-if="data?.course.description"
          class="mt-5 whitespace-pre-line leading-7"
        >
          {{ data.course.description }}
        </p>
      </div>
    </div>
    <section class="mt-8">
      <div>
        <AppBadge>DOWNLOADS</AppBadge><h2 class="mt-3 text-2xl font-black">
          Materiais do curso
        </h2><p class="mt-2 text-muted">
          Apostilas e arquivos disponibilizados pelo instrutor.
        </p>
      </div>
      <div
        v-if="data?.materials.length"
        class="mt-5 grid gap-4 md:grid-cols-2"
      >
        <a
          v-for="material in data.materials"
          :key="material.id"
          :href="material.downloadUrl"
          class="flex items-center justify-between gap-4 rounded-card border border-border bg-white p-5 hover:border-primary-400"
        ><div><p class="font-black">{{ material.title }}</p><p class="mt-1 text-sm text-muted">{{ fileLabel(material.mimeType) }} · {{ fileSize(material.fileSize) }}</p></div><span class="font-bold text-primary-700">Baixar ↓</span></a>
      </div>
      <p
        v-else
        class="mt-5 rounded-card border border-dashed border-border bg-white p-8 text-center text-muted"
      >
        Nenhum material disponível para este curso no momento.
      </p>
    </section>
  </section>
</template>
