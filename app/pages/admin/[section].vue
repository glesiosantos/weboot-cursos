<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
const route = useRoute()
const title = computed(() => String(route.params.section).replace('-', ' '))
</script>

<template>
  <section>
    <AppBadge>EM DESENVOLVIMENTO</AppBadge><h1 class="mt-4 text-3xl font-black capitalize">
      {{ title }}
    </h1><p class="mt-3 text-muted">
      Este módulo ainda não possui lógica de negócio implementada.
    </p>
  </section>
</template>
