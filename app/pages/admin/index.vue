<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Administração | WeBoot Cursos', robots: 'noindex' })
</script>

<template>
  <section>
    <AppBadge>FASE 1</AppBadge><h1 class="mt-4 text-3xl font-black">
      Dashboard
    </h1><p class="mt-2 text-muted">
      Estrutura administrativa pronta para receber os módulos do produto.
    </p><div class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in ['Cursos', 'Alunos', 'Inscrições', 'Certificados', 'Configurações']"
        :key="item"
        class="rounded-card border border-border bg-white p-6"
      >
        <p class="font-bold">
          {{ item }}
        </p><p class="mt-3 text-sm text-muted">
          Em desenvolvimento
        </p>
      </article>
    </div>
  </section>
</template>
