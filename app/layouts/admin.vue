<script setup lang="ts">
const client = useSupabaseClient()
const links = [{ l: 'Dashboard', i: '⌂', to: '/admin' }, { l: 'Cursos', i: '▤', to: '/admin/cursos' }, { l: 'Instrutores', i: '♙', to: '/admin/instrutores' }, { l: 'Alunos', i: '◎', to: '/admin/alunos' }, { l: 'Inscrições', i: '✓', to: '/admin/inscricoes' }, { l: 'Certificados', i: '◇', to: '/admin/certificados' }, { l: 'Configurações', i: '⚙', to: '/admin/configuracoes' }]
const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="border-b border-border bg-ink p-5 text-white lg:min-h-screen lg:border-b-0">
      <AppLogo class="[&_span:last-child]:!text-white" /><nav
        class="mt-8 flex gap-2 overflow-x-auto lg:flex-col"
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
      <header class="flex h-18 items-center justify-between border-b border-border bg-white px-5 sm:px-8">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary-600">
            Administração
          </p><p class="font-bold">
            WeBoot Cursos
          </p>
        </div><div class="flex items-center gap-4">
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
      </header><main class="p-5 sm:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
