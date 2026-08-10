<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
const user = useSupabaseUser()
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">
      Olá<span v-if="user?.user_metadata?.name">, {{ user.user_metadata.name }}</span> 👋
    </h1>
    <div class="mt-8 rounded-xl border border-slate-200 bg-white p-8">
      <h2 class="font-semibold">
        Meus cursos
      </h2><p class="mt-2 text-slate-600">
        Suas matrículas aparecerão aqui.
      </p>
    </div>
  </section>
</template>
