<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps<{ label: string, icon: 'edit' | 'users' | 'eye' | 'copy' | 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'materials' | 'bell' | 'checkin', to?: string, danger?: boolean, disabled?: boolean }>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :aria-label="label"
    :title="label"
    class="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white text-primary-700 hover:bg-primary-50"
    v-bind="$attrs"
  ><AppIcon :name="icon" /></NuxtLink>
  <button
    v-else
    type="button"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
    class="inline-flex size-10 items-center justify-center rounded-xl border bg-white disabled:opacity-40"
    :class="danger ? 'border-red-200 text-danger hover:bg-red-50' : 'border-border text-primary-700 hover:bg-primary-50'"
    v-bind="$attrs"
  >
    <AppIcon :name="icon" />
  </button>
</template>
