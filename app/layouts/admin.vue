<script setup lang="ts">
const client = useSupabaseClient()
const route = useRoute()
const menuOpen = ref(false)
const links = [{ l: 'Dashboard', i: '⌂', to: '/admin' }, { l: 'Cursos', i: '▤', to: '/admin/cursos' }, { l: 'Biblioteca', i: '▣', to: '/admin/biblioteca' }, { l: 'Instrutores', i: '♙', to: '/admin/instrutores' }, { l: 'Alunos', i: '◎', to: '/admin/alunos' }, { l: 'Inscrições', i: '✓', to: '/admin/inscricoes' }, { l: 'Certificados', i: '◇', to: '/admin/certificados' }, { l: 'Configurações', i: '⚙', to: '/admin/configuracoes' }]
const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="border-b border-border bg-ink p-4 text-white sm:p-5 lg:min-h-screen lg:border-b-0">
      <div class="flex items-center justify-between gap-3">
        <AppLogo class="[&_span:last-child]:!text-white" /><button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-xl border border-white/20 lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="admin-navigation"
          :aria-label="menuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'"
          @click="menuOpen = !menuOpen"
        >
          <span
            aria-hidden="true"
            class="text-xl"
          >{{ menuOpen ? '×' : '☰' }}</span>
        </button>
      </div><nav
        id="admin-navigation"
        :class="menuOpen ? 'flex' : 'hidden lg:flex'"
        class="mt-5 flex-col gap-2 lg:mt-8"
        aria-label="Administração"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.l"
          :to="link.to"
          class="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-primary-100 hover:bg-white/10"
        ><span>{{ link.i }}</span>{{ link.l }}</NuxtLink>
      </nav>
    </aside><div>
      <header class="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 sm:px-8">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary-600">
            Administração
          </p><p class="font-bold">
            WeBoot Cursos
          </p>
        </div><div class="flex items-center gap-3 sm:gap-4">
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
      </header><main class="min-w-0 p-4 sm:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
