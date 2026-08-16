<script setup lang="ts">
import type { Course } from '~/types/course'

const props = withDefaults(defineProps<{ course: Course, mode?: 'public' | 'preview', previewViewport?: 'auto' | 'desktop' | 'tablet' | 'mobile' }>(), { mode: 'public', previewViewport: 'auto' })
const folderPreviewOpen = ref(false)
const isPreview = computed(() => props.mode === 'preview')
const presentationGrid = computed(() => props.previewViewport === 'mobile' || props.previewViewport === 'tablet' ? 'grid-cols-1' : 'lg:grid-cols-[1fr_380px]')
</script>

<template>
  <main class="py-12 sm:py-18">
    <div
      class="grid gap-10"
      :class="presentationGrid"
    >
      <article>
        <AppBadge>{{ course.course_type }}</AppBadge><h1 class="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          {{ course.title }}
        </h1><p class="mt-5 max-w-3xl text-lg leading-8 text-muted">
          {{ course.short_description }}
        </p>
        <img
          v-if="course.cover_url"
          :src="course.cover_url"
          :alt="`Capa do curso ${course.title}`"
          width="960"
          height="600"
          class="mt-8 aspect-[16/10] w-full rounded-card object-cover"
          fetchpriority="high"
        >
        <section class="mt-10">
          <h2 class="text-2xl font-black">
            Sobre o curso
          </h2><p class="mt-4 whitespace-pre-line leading-7 text-muted">
            {{ course.description }}
          </p>
        </section>
        <section
          v-if="course.program || course.modules?.length"
          class="mt-10"
        >
          <h2 class="text-2xl font-black">
            Programa
          </h2><p
            v-if="course.program"
            class="mt-4 whitespace-pre-line text-muted"
          >
            {{ course.program }}
          </p><div class="mt-5 space-y-4">
            <article
              v-for="(module, index) in course.modules"
              :key="module.id"
              class="rounded-card border border-border bg-white p-5"
            >
              <h3 class="font-extrabold">
                Módulo {{ index + 1 }} — {{ module.title }}
              </h3><ul class="mt-3 space-y-2 text-sm text-muted">
                <li
                  v-for="lesson in module.lessons"
                  :key="lesson.id"
                  class="flex justify-between gap-4"
                >
                  <span>{{ lesson.title }}<template v-if="lesson.duration_minutes"> · {{ lesson.duration_minutes }} min</template></span><AppBadge v-if="lesson.is_preview">
                    Aula gratuita
                  </AppBadge>
                </li>
              </ul>
            </article>
          </div>
        </section>
        <div class="mt-10 grid gap-6 sm:grid-cols-2">
          <section v-if="course.requirements">
            <h2 class="text-xl font-black">
              Requisitos
            </h2><p class="mt-3 whitespace-pre-line text-muted">
              {{ course.requirements }}
            </p>
          </section><section v-if="course.target_audience">
            <h2 class="text-xl font-black">
              Público-alvo
            </h2><p class="mt-3 whitespace-pre-line text-muted">
              {{ course.target_audience }}
            </p>
          </section>
        </div>
        <section
          v-if="course.folder_url"
          class="mt-10"
        >
          <h2 class="text-2xl font-black">
            Material de divulgação
          </h2><div class="mt-5 max-w-md overflow-hidden rounded-card border border-border bg-white p-4">
            <template v-if="course.folder_mime_type === 'application/pdf'">
              <p class="font-extrabold">
                Folder em PDF
              </p><a
                :href="course.folder_url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex font-bold text-primary underline"
              >Ver folder em PDF</a>
            </template><template v-else>
              <img
                :src="course.folder_url"
                :alt="course.folder_alt_text || `Folder promocional do curso ${course.title}`"
                class="max-h-[640px] w-full rounded-xl object-contain"
                loading="lazy"
              ><button
                type="button"
                class="mt-4 font-bold text-primary underline"
                @click="folderPreviewOpen = true"
              >
                Ver folder
              </button>
            </template>
          </div>
        </section>
      </article>
      <aside class="h-fit rounded-card border border-border bg-white p-6 shadow-soft lg:sticky lg:top-6">
        <p class="text-sm text-muted">
          Investimento
        </p><p
          v-if="course.pricing_type !== 'BATCHES' && course.promotional_price !== null"
          class="mt-1 text-sm text-muted line-through"
        >
          {{ formatPrice(course.price) }}
        </p><p class="text-3xl font-black">
          {{ course.public_price === null ? 'Lotes indisponíveis' : formatPrice(course.public_price ?? course.promotional_price ?? course.price) }}
        </p><p
          v-if="course.current_batch"
          class="mt-1 text-sm font-bold text-primary"
        >
          {{ course.current_batch.name }}
        </p><div
          v-if="course.current_batch"
          class="mt-4 rounded-xl bg-surface p-4 text-sm"
        >
          <p v-if="course.current_batch.max_sales !== null">
            <b>{{ course.current_batch.max_sales }} vagas neste lote</b>
          </p><p
            v-if="course.current_batch.ends_at"
            class="mt-2 text-muted"
          >
            Válido até: <b class="text-ink">{{ new Date(course.current_batch.ends_at).toLocaleDateString('pt-BR') }}</b>
          </p>
        </div><section
          v-if="course.upcoming_batches?.length"
          class="mt-6 border-t border-border pt-5"
        >
          <h2 class="font-black">
            Próximos lotes
          </h2><div
            v-for="batch in course.upcoming_batches"
            :key="batch.id"
            class="mt-3 flex justify-between gap-4 text-sm"
          >
            <span>{{ batch.name }}</span><b>{{ formatPrice(batch.price) }}</b>
          </div>
        </section><dl class="mt-6 space-y-3 border-y border-border py-5 text-sm">
          <div class="flex justify-between">
            <dt>Instrutor</dt><dd class="font-bold">
              {{ course.instructor_name || 'Equipe WeBoot' }}
            </dd>
          </div><div class="flex justify-between">
            <dt>Carga horária</dt><dd class="font-bold">
              {{ course.workload_hours }}h
            </dd>
          </div><template v-if="course.presential">
            <div class="flex justify-between">
              <dt>Data</dt><dd class="font-bold">
                {{ formatCourseDate(course.presential.starts_at) }}
              </dd>
            </div><div class="flex justify-between">
              <dt>Horário</dt><dd class="font-bold">
                {{ formatCourseTime(course.presential.starts_at) }}
              </dd>
            </div><div class="flex justify-between">
              <dt>Local</dt><dd class="text-right font-bold">
                {{ course.presential.location_name }}<br>{{ course.presential.city }}/{{ course.presential.state }}
              </dd>
            </div><div class="flex justify-between">
              <dt>Vagas</dt><dd class="font-bold">
                {{ course.presential.max_students }}
              </dd>
            </div>
          </template><div class="flex justify-between">
            <dt>Certificado</dt><dd class="font-bold">
              Incluso
            </dd>
          </div>
        </dl><div
          v-if="isPreview"
          class="mt-6 rounded-xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-900"
        >
          Ações comerciais desativadas no preview
        </div><CoursePurchaseCTA
          v-else
          :course-id="course.id"
          :course-slug="course.slug"
          class="mt-6"
        />
      </aside>
    </div>
    <Teleport to="body">
      <div
        v-if="folderPreviewOpen && course.folder_url"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Visualização ampliada do folder"
        @click.self="folderPreviewOpen = false"
      >
        <div class="w-full max-w-3xl">
          <button
            type="button"
            class="mb-3 rounded-lg bg-white px-4 py-2 font-bold"
            @click="folderPreviewOpen = false"
          >
            Fechar
          </button><img
            :src="course.folder_url"
            :alt="course.folder_alt_text || `Folder promocional do curso ${course.title}`"
            class="max-h-[calc(100vh-6rem)] w-full rounded-xl bg-white object-contain"
          >
        </div>
      </div>
    </Teleport>
  </main>
</template>
