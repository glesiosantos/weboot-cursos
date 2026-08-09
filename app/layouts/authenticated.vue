<script setup lang="ts">
const client = useSupabaseClient()
const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b bg-white">
      <div class="mx-auto flex max-w-7xl justify-between px-4 py-4">
        <NuxtLink
          to="/aluno"
          class="font-bold text-brand-700"
        >Área do aluno</NuxtLink>
        <button
          class="text-sm font-semibold"
          type="button"
          @click="logout"
        >
          Sair
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-7xl p-4">
      <slot />
    </main>
  </div>
</template>
