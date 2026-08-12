<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Novo curso | Administração', robots: 'noindex' })
const saved = (id: string) => navigateTo(`/admin/cursos/${id}`)
</script>

<template>
  <section>
    <AppBadge>NOVO CURSO</AppBadge><h1 class="mt-3 text-3xl font-black">
      Criar curso
    </h1><AdminCourseForm @saved="saved" />
  </section>
</template>
