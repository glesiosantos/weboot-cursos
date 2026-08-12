<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
const user = useSupabaseUser()
const { data: courses, pending } = usePublishedCourses()
const { data: enrolledCourseIds } = useActiveCourseEnrollments()
const newestCourses = computed(() => (courses.value ?? []).slice(0, 3))
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">
      Olá<span v-if="user?.user_metadata?.name">, {{ user.user_metadata.name }}</span> 👋
    </h1>
    <div class="mt-8 rounded-xl border border-slate-200 bg-white p-8">
      <h2 class="font-semibold">
        Meus cursos
      </h2><p class="mt-2 text-slate-600">
        Suas matrículas aparecerão aqui.
      </p>
    </div><section class="mt-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <AppBadge>NOVOS CURSOS</AppBadge><h2 class="mt-3 text-2xl font-black">
            Explore novos cursos
          </h2>
        </div><AppButton
          to="/aluno/catalogo"
          variant="secondary"
        >
          Ver catálogo completo
        </AppButton>
      </div><div
        v-if="pending"
        class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <CourseCardSkeleton
          v-for="n in 3"
          :key="n"
        />
      </div><div
        v-else-if="newestCourses.length"
        class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <CourseCard
          v-for="course in newestCourses"
          :key="course.id"
          :course="course"
          context="student"
          :enrolled="enrolledCourseIds?.has(course.id)"
        />
      </div><p
        v-else
        class="mt-6 rounded-card border border-dashed border-border bg-white p-8 text-center text-muted"
      >
        Nenhum novo curso disponível no momento.
      </p>
    </section>
  </section>
</template>
