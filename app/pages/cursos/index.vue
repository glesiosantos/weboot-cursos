<script setup lang="ts">
useSeoMeta({ title: 'Cursos | Weboot Cursos', description: 'Conheça nossos cursos online e presenciais.' })
const { data: courses, pending } = usePublishedCourses()
</script>

<template>
  <div>
    <section class="page-shell pt-14 sm:pt-20">
      <AppBadge>CATÁLOGO WEBOOT</AppBadge><h1 class="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
        Cursos para colocar<br>conhecimento em prática.
      </h1>
    </section><FeaturedCourses
      :courses="courses ?? []"
      :loading="pending"
    />
  </div>
</template>
