<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type StudentCourse = { id: string, courses: { title: string, slug: string, short_description: string, course_type: string } | null }
const { data: enrollments } = await useFetch<StudentCourse[]>('/api/student/courses')
</script>

<template>
  <section>
    <AppBadge>MEUS CURSOS</AppBadge><h1 class="mt-4 text-3xl font-black">
      Cursos adquiridos
    </h1><div class="mt-7 grid gap-5 md:grid-cols-2">
      <article
        v-for="item in enrollments"
        :key="item.id"
        class="rounded-card border border-border bg-white p-6"
      >
        <AppBadge>{{ item.courses?.course_type }}</AppBadge><h2 class="mt-3 text-xl font-extrabold">
          {{ item.courses?.title }}
        </h2><p class="mt-2 text-sm text-muted">
          {{ item.courses?.short_description }}
        </p><AppButton
          class="mt-5"
          :to="`/cursos/${item.courses?.slug}`"
        >
          Acessar curso
        </AppButton>
      </article><p
        v-if="!enrollments?.length"
        class="text-muted"
      >
        Você ainda não possui cursos ativos.
      </p>
    </div>
  </section>
</template>
