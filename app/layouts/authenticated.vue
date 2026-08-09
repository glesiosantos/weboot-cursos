<script setup lang="ts">
const client = useSupabaseClient()
const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
const links = [{ l: 'Visão geral', to: '/aluno' }, { l: 'Meus cursos', to: '/aluno/cursos' }, { l: 'Certificados', to: '/aluno/certificados' }, { l: 'Pedidos', to: '/aluno/pedidos' }, { l: 'Perfil', to: '/aluno/perfil' }]
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-border bg-white">
      <div class="page-shell flex h-18 items-center justify-between">
        <AppLogo /><div class="flex items-center gap-4">
          <NuxtLink
            to="/conta/seguranca"
            class="text-sm font-bold text-primary-700"
          >Segurança</NuxtLink><button
            type="button"
            class="text-sm font-bold"
            @click="logout"
          >
            Sair
          </button>
        </div>
      </div>
    </header><div class="page-shell grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <nav
          class="flex gap-2 overflow-x-auto lg:flex-col"
          aria-label="Área do aluno"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.l"
            :to="link.to"
            class="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-white hover:text-primary-700"
          >{{ link.l }}</NuxtLink>
        </nav>
      </aside><main><slot /></main>
    </div>
  </div>
</template>
