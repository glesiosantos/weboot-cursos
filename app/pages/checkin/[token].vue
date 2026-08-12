<script setup lang="ts">
definePageMeta({ layout: false }); useSeoMeta({ robots: 'noindex,nofollow' })
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-canvas p-6">
    <section class="max-w-lg rounded-card border border-border bg-white p-8 text-center">
      <AppLogo /><h1 class="mt-6 text-2xl font-black">
        Credencial de evento
      </h1><p class="mt-3 text-muted">
        Apresente esta tela à equipe autorizada. Nenhum dado pessoal é exposto publicamente pelo token.
      </p>
    </section>
  </main>
</template>
