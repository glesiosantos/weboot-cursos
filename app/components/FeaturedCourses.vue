<script setup lang="ts">
import type { Course, CourseMode } from '~/types/course'

const props = defineProps<{ courses: Course[], loading?: boolean }>()
const active = ref<CourseMode>('TODOS')
const search = ref('')
const tabs: CourseMode[] = ['TODOS', 'ONLINE', 'PRESENCIAL']
const filtered = computed(() => filterCourses(props.courses, active.value, search.value))
</script>

<template>
  <section
    id="cursos"
    class="section-space bg-canvas"
  >
    <div class="page-shell">
      <div class="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <SectionHeading
          eyebrow="Catálogo"
          title="Cursos em destaque"
          description="Formações diretas ao ponto, pensadas para desenvolver habilidades que fazem diferença na prática."
        /><div class="flex flex-col gap-3 sm:flex-row">
          <label
            class="sr-only"
            for="course-search"
          >Buscar cursos</label><input
            id="course-search"
            v-model="search"
            type="search"
            placeholder="Buscar cursos..."
            class="min-h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-primary-500 sm:w-56"
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
              class="rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline-offset-2"
              :class="active === tab ? 'bg-primary-600 text-white' : 'text-muted hover:text-primary-700'"
              @click="active = tab"
            >
              {{ tab === 'TODOS' ? 'Todos' : tab[0] + tab.slice(1).toLowerCase() }}
            </button>
          </div>
        </div>
      </div><div
        v-if="loading"
        class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <CourseCardSkeleton
          v-for="n in 3"
          :key="n"
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
      /><div class="mt-10 text-center">
        <AppButton
          to="/cursos"
          variant="secondary"
        >
          Ver todos os cursos <span aria-hidden="true">→</span>
        </AppButton>
      </div>
    </div>
  </section>
</template>
