<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ to?: string, variant?: 'primary' | 'secondary' | 'ghost', type?: 'button' | 'submit', disabled?: boolean }>(), { variant: 'primary', type: 'button', to: undefined })
const styles = { primary: 'bg-primary-600 text-white hover:bg-primary-700', secondary: 'border border-border bg-white text-ink hover:bg-primary-50', ghost: 'text-ink hover:bg-primary-50' }
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold"
    :class="styles[variant]"
    v-bind="$attrs"
  ><slot /></NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    class="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
    :class="styles[variant]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
