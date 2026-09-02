<script setup lang="ts">
defineProps<{ name: 'edit' | 'users' | 'eye' | 'copy' | 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'materials' | 'bell' | 'checkin' | 'key' | 'ticket' | 'trash' | 'payment' | 'qrcode' }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="size-5"
  >
    <template v-if="name === 'edit'"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></template>
    <template v-else-if="name === 'users'"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
      cx="9"
      cy="7"
      r="4"
    /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></template>
    <template v-else-if="name === 'eye'"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle
      cx="12"
      cy="12"
      r="3"
    /></template>
    <template v-else-if="name === 'copy'"><rect
      x="9"
      y="9"
      width="12"
      height="12"
      rx="2"
    /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></template>
    <template v-else-if="name === 'publish'"><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 21h14" /></template>
    <template v-else-if="name === 'unpublish'"><path d="M12 21V9M17 16l-5 5-5-5" /><path d="M5 3h14" /></template>
    <template v-else-if="name === 'archive'"><path d="M3 6h18M5 6v15h14V6M3 3h18v3H3z" /><path d="M9 10h6" /></template>
    <template v-else-if="name === 'unarchive'"><path d="M3 6h18M5 6v15h14V6M3 3h18v3H3z" /><path d="M12 17V9M8.5 12.5 12 9l3.5 3.5" /></template>
    <template v-else-if="name === 'materials'"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></template>
    <template v-else-if="name === 'bell'"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></template>
    <template v-else-if="name === 'key'"><circle
      cx="7.5"
      cy="15.5"
      r="4.5"
    /><path d="m11 12 9-9M15 8l3 3M17 6l3 3" /></template>
    <template v-else-if="name === 'ticket'"><path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4Z" /><path d="M13 5v2M13 17v2M13 11v2" /></template>
    <template v-else-if="name === 'trash'"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></template>
    <template v-else-if="name === 'payment'"><rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="2"
    /><path d="M2 10h20M6 15h2" /></template>
    <template v-else-if="name === 'qrcode'"><rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
    /><rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
    /><rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
    /><path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" /></template>
    <template v-else><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></template>
  </svg>
</template>
