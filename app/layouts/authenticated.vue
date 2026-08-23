<script setup lang="ts">
const client = useSupabaseClient()
const route = useRoute()
const menuOpen = ref(false)
const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
const links = [{ l: 'Visão geral', to: '/aluno' }, { l: 'Meus cursos', to: '/aluno/cursos' }, { l: 'Catálogo', to: '/aluno/catalogo' }, { l: 'Eventos', to: '/aluno/eventos' }, { l: 'Certificados', to: '/aluno/certificados' }, { l: 'Pedidos', to: '/aluno/pedidos' }, { l: 'Perfil', to: '/aluno/perfil' }, { l: 'Segurança', to: '/conta/seguranca' }]
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-border bg-white">
      <div class="page-shell flex min-h-18 flex-wrap items-center justify-between gap-3 py-3">
        <AppLogo /><div class="flex items-center gap-3 sm:gap-4">
          <NuxtLink
            to="/conta/seguranca"
            class="text-sm font-bold text-primary-700"
          >Segurança</NuxtLink><button
            type="button"
            class="text-sm font-bold"
            @click="logout"
          >
            Sair
          </button><button
            type="button"
            class="grid size-11 place-items-center rounded-xl border border-border lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="student-navigation"
            :aria-label="menuOpen ? 'Fechar menu da área do aluno' : 'Abrir menu da área do aluno'"
            @click="menuOpen = !menuOpen"
          >
            <span
              aria-hidden="true"
              class="text-xl"
            >{{ menuOpen ? '×' : '☰' }}</span>
          </button>
        </div>
      </div>
    </header><div class="page-shell grid min-w-0 gap-5 py-5 sm:py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <aside :class="menuOpen ? 'block' : 'hidden lg:block'">
        <nav
          id="student-navigation"
          class="flex flex-col gap-2 rounded-card border border-border bg-white p-3 lg:border-0 lg:bg-transparent lg:p-0"
          aria-label="Área do aluno"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.l"
            :to="link.to"
            class="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-white hover:text-primary-700"
          >{{ link.l }}</NuxtLink>
        </nav>
      </aside><main class="min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
