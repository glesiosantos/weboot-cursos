<script setup lang="ts">
import type { CourseMode } from '~/types/course'

definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
useSeoMeta({ title: 'Catálogo | Área do aluno', robots: 'noindex, nofollow' })
const { data: courses, pending } = usePublishedCourses()
const { data: enrolledCourseIds } = useActiveCourseEnrollments()
const active = ref<CourseMode>('TODOS')
const search = ref('')
const tabs: CourseMode[] = ['TODOS', 'ONLINE', 'PRESENCIAL']
const filtered = computed(() => filterCourses(courses.value ?? [], active.value, search.value))
</script>

<template>
  <section>
    <AppBadge>CATÁLOGO</AppBadge><h1 class="mt-4 text-3xl font-black sm:text-4xl">
      Encontre seu próximo curso
    </h1><p class="mt-3 text-muted">
      Continue desenvolvendo suas habilidades com novos cursos.
    </p><div class="mt-7 flex flex-col gap-3 sm:flex-row">
      <label
        class="sr-only"
        for="student-course-search"
      >Buscar cursos</label><input
        id="student-course-search"
        v-model="search"
        type="search"
        placeholder="Buscar cursos..."
        class="min-h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm"
      ><div
        class="flex rounded-xl border border-border bg-white p-1"
        role="tablist"
        aria-label="Modalidade"
      >
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          role="tab"
          :aria-selected="active === tab"
          class="flex-1 rounded-lg px-3 py-2 text-xs font-bold"
          :class="active === tab ? 'bg-ink text-white' : 'text-muted'"
          @click="active = tab"
        >
          {{ tab === 'TODOS' ? 'Todos' : tab[0] + tab.slice(1).toLowerCase() }}
        </button>
      </div>
    </div><div
      v-if="pending"
      class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <CourseCardSkeleton
        v-for="n in 3"
        :key="n"
      />
    </div><div
      v-else-if="filtered.length"
      class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <CourseCard
        v-for="course in filtered"
        :key="course.id"
        :course="course"
        context="student"
        :enrolled="enrolledCourseIds?.has(course.id)"
      />
    </div><div
      v-else
      class="mt-8 rounded-card border border-dashed border-border bg-white p-10 text-center text-muted"
    >
      Nenhum novo curso disponível no momento.
    </div>
  </section>
</template>
