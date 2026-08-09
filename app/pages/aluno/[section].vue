<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: 'auth' })
const route = useRoute()
const title = computed(() => String(route.params.section).replace('-', ' '))
</script>

<template>
  <section>
    <AppBadge>ÁREA DO ALUNO</AppBadge><h1 class="mt-4 text-3xl font-black capitalize">
      {{ title }}
    </h1><div class="mt-7 rounded-card border border-dashed border-border bg-white p-10 text-center text-muted">
      Nenhum item disponível ainda.
    </div>
  </section>
</template>
