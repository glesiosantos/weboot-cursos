<script setup lang="ts">
import type { Course, CourseMode } from '~/types/course'

const props = defineProps<{ courses: Course[], loading?: boolean }>()
const active = ref<CourseMode>('TODOS')
const tabs: CourseMode[] = ['TODOS', 'ONLINE', 'PRESENCIAL']
const filtered = computed(() => active.value === 'TODOS' ? props.courses : props.courses.filter(course => course.course_type === active.value))
</script>

<template>
  <section
    id="cursos"
    class="section-space"
  >
    <div class="page-shell">
      <div class="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Catálogo"
          title="Cursos em destaque"
          description="Formações diretas ao ponto, pensadas para desenvolver habilidades que fazem diferença na prática."
        /><div
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
            class="rounded-lg px-3 py-2 text-xs font-bold"
            :class="active === tab ? 'bg-ink text-white' : 'text-muted'"
            @click="active = tab"
          >
            {{ tab === 'TODOS' ? 'Todos' : tab[0] + tab.slice(1).toLowerCase() }}
          </button>
        </div>
      </div><div
        v-if="loading"
        class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="h-96 animate-pulse rounded-card bg-white"
        />
      </div><div
        v-else-if="filtered.length"
        class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <CourseCard
          v-for="course in filtered"
          :key="course.id"
          :course="course"
        />
      </div><EmptyCourses
        v-else
        class="mt-10"
      />
    </div>
  </section>
</template>
