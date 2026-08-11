<script setup lang="ts">
import type { Course } from '~/types/course'

const route = useRoute()
const config = useRuntimeConfig()
const { data: course } = await useFetch<Course>(`/api/courses/${encodeURIComponent(String(route.params.slug))}`)
if (!course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
const canonical = computed(() => `${config.public.appUrl}/cursos/${course.value?.slug}`)
useSeoMeta({
  title: () => `${course.value?.title} | WeBoot Cursos`, description: () => course.value?.short_description,
  ogTitle: () => course.value?.title, ogDescription: () => course.value?.short_description, ogImage: () => course.value?.cover_url ?? undefined,
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main
    v-if="course"
    class="page-shell py-12 sm:py-18"
  >
    <div class="grid gap-10 lg:grid-cols-[1fr_380px]">
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
                  <span>{{ lesson.title }}</span><AppBadge v-if="lesson.is_preview">
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
        </p>
        <dl class="mt-6 space-y-3 border-y border-border py-5 text-sm">
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
        </dl>
        <CoursePurchaseCTA class="mt-6" />
      </aside>
    </div>
  </main>
</template>
