<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type CourseAccess = {
  enrollmentId: string
  course: { id: string, title: string, slug: string, shortDescription: string, description: string | null, courseType: string, coverUrl: string | null }
  materials: { id: string, title: string, mimeType: string, fileSize: number, downloadUrl: string }[]
  preparation: { id: string, title: string, summary: string | null, type: 'POST' | 'PDF' | 'VIDEO', content: string | null, externalUrl: string | null, mediaUrl: string | null, images: { id: string, altText: string, url: string }[], required: boolean, preEvent: boolean, dueAt: string | null, viewedAt: string | null, completedAt: string | null }[]
}
const route = useRoute()
const { data, error } = await useFetch<CourseAccess>(`/api/student/courses/${String(route.params.enrollmentId)}`)
if (error.value || !data.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado na sua conta' }) }
const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
const fileLabel = (mime: string) => ({ 'application/pdf': 'PDF', 'application/zip': 'ZIP', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX' }[mime] ?? 'Arquivo')
const activityBusy = ref<string | null>(null); const activityError = ref('')
const registerActivity = async (activity: CourseAccess['preparation'][number], completed: boolean) => {
  activityBusy.value = activity.id; activityError.value = ''
  try { const progress = await $fetch<{ completed_at?: string | null }>(`/api/student/knowledge/${activity.id}/progress`, { method: 'POST', body: { enrollmentId: data.value!.enrollmentId, completed } }); if (completed) { activity.completedAt = progress.completed_at ?? new Date().toISOString() } }
  catch { activityError.value = `Não foi possível registrar a atividade “${activity.title}”.` }
  finally { activityBusy.value = null }
}
const openActivity = (activity: CourseAccess['preparation'][number]) => { if (!activity.viewedAt) { activity.viewedAt = new Date().toISOString(); void registerActivity(activity, false) } }
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
      <AppBadge>ANTES DO EVENTO</AppBadge><h2 class="mt-3 text-2xl font-black">
        Preparação para o evento
      </h2><p class="mt-2 text-muted">
        Conclua os passos abaixo para chegar com o ambiente pronto.
      </p><p
        v-if="activityError"
        role="alert"
        class="mt-4 text-sm font-bold text-danger"
      >
        {{ activityError }}
      </p>
      <div
        v-if="data?.preparation.length"
        class="mt-5 space-y-5"
      >
        <article
          v-for="activity in data.preparation"
          :key="activity.id"
          class="rounded-card border bg-white p-4 sm:p-6"
          :class="activity.completedAt ? 'border-green-300' : 'border-border'"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="flex flex-wrap gap-2">
                <AppBadge>{{ activity.type }}</AppBadge><AppBadge v-if="activity.required">
                  Obrigatória
                </AppBadge><AppBadge v-if="activity.completedAt">
                  Concluída
                </AppBadge>
              </div><h3 class="mt-3 text-xl font-black">
                {{ activity.title }}
              </h3><p
                v-if="activity.summary"
                class="mt-2 text-muted"
              >
                {{ activity.summary }}
              </p><p
                v-if="activity.dueAt"
                class="mt-2 text-sm font-bold"
              >
                Prazo: {{ new Date(activity.dueAt).toLocaleString('pt-BR') }}
              </p>
            </div>
          </div>
          <div
            v-if="activity.type === 'POST'"
            class="mt-5 whitespace-pre-wrap rounded-xl bg-canvas p-4 leading-7"
            @click.once="openActivity(activity)"
          >
            {{ activity.content }}
          </div>
          <div
            v-if="activity.images.length"
            class="mt-5 grid gap-4 md:grid-cols-2"
          >
            <img
              v-for="image in activity.images"
              :key="image.id"
              :src="image.url"
              :alt="image.altText"
              class="max-h-[520px] w-full rounded-xl border border-border object-contain"
            >
          </div>
          <a
            v-if="activity.type === 'PDF' && activity.mediaUrl"
            :href="activity.mediaUrl"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex min-h-11 items-center font-bold text-primary-700"
            @click="openActivity(activity)"
          >Abrir PDF ↗</a>
          <video
            v-if="activity.type === 'VIDEO' && activity.mediaUrl"
            :src="activity.mediaUrl"
            controls
            preload="metadata"
            class="mt-5 max-h-[560px] w-full rounded-xl bg-black"
            @play.once="openActivity(activity)"
          />
          <a
            v-else-if="activity.type === 'VIDEO' && activity.externalUrl"
            :href="activity.externalUrl"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex min-h-11 items-center font-bold text-primary-700"
            @click="openActivity(activity)"
          >Assistir vídeo ↗</a>
          <div class="mt-5 border-t border-border pt-4">
            <AppButton
              v-if="!activity.completedAt"
              :disabled="activityBusy === activity.id"
              @click="registerActivity(activity, true)"
            >
              {{ activityBusy === activity.id ? 'Registrando…' : 'Concluir atividade' }}
            </AppButton><p
              v-else
              class="font-bold text-green-700"
            >
              ✓ Concluída em {{ new Date(activity.completedAt).toLocaleString('pt-BR') }}
            </p>
          </div>
        </article>
      </div><p
        v-else
        class="mt-5 rounded-card border border-dashed border-border bg-white p-8 text-center text-muted"
      >
        Nenhuma preparação pré-evento disponível.
      </p>
    </section>
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
