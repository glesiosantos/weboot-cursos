<script setup lang="ts">
defineProps<{ eyebrow?: string, title: string, description?: string, align?: 'left' | 'center' }>()
</script>

<template>
  <div :class="align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'">
    <p
      v-if="eyebrow"
      class="mb-3 text-xs font-extrabold uppercase tracking-[.18em] text-primary-600"
    >
      {{ eyebrow }}
    </p><h2 class="text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">
      {{ title }}
    </h2><p
      v-if="description"
      class="mt-4 text-base leading-7 text-muted sm:text-lg"
    >
      {{ description }}
    </p>
  </div>
</template>
