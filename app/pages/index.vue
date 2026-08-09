<script setup lang="ts">
useSeoMeta({ title: 'Weboot Cursos', description: 'Cursos online e presenciais para acelerar sua carreira.' })
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-24 text-center">
    <p class="font-semibold text-brand-600">
      Aprendizado que transforma
    </p>
    <h1 class="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
      Cursos práticos para o próximo passo da sua carreira
    </h1>
    <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
      Aprenda online ou presencialmente com especialistas e uma experiência segura.
    </p>
    <NuxtLink
      to="/cursos"
      class="mt-8 inline-flex rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
    >Conhecer cursos</NuxtLink>
  </section>
</template>
