<script setup lang="ts">
const open = ref(false)
const links = [{ label: 'Início', to: '/' }, { label: 'Cursos', to: '/cursos' }, { label: 'Sobre', to: '/#sobre' }, { label: 'Certificados', to: '/certificados' }, { label: 'Blog', to: '/#blog' }]
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur">
    <nav
      class="page-shell flex h-18 items-center justify-between gap-3"
      aria-label="Principal"
    >
      <div class="min-w-0 shrink">
        <AppLogo />
      </div><div class="hidden items-center gap-7 lg:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="text-sm font-semibold text-muted hover:text-primary-700"
        >{{ link.label }}</NuxtLink>
      </div><div class="ml-auto hidden items-center gap-2 sm:flex lg:ml-0">
        <div class="hidden lg:block">
          <AppButton
            to="/login"
            variant="ghost"
          >
            Entrar
          </AppButton>
        </div><AppButton
          to="/cursos"
          class="px-3 sm:px-5"
        >
          Explorar cursos
        </AppButton>
      </div><button
        type="button"
        class="grid size-11 place-items-center rounded-xl border border-border bg-white lg:hidden"
        :aria-expanded="open"
        :aria-label="open ? 'Fechar menu' : 'Abrir menu'"
        @click="open = !open"
      >
        <svg
          v-if="!open"
          aria-hidden="true"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        ><path d="M4 7h16M4 12h16M4 17h16" /></svg><svg
          v-else
          aria-hidden="true"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        ><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </nav><div
      v-if="open"
      class="border-t border-border bg-white px-5 py-5 shadow-soft lg:hidden"
    >
      <div class="flex flex-col gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="rounded-lg px-3 py-3 font-semibold"
          @click="open = false"
        >{{ link.label }}</NuxtLink><AppButton
          to="/login"
          variant="secondary"
        >
          Entrar
        </AppButton><AppButton to="/cursos">
          Explorar cursos
        </AppButton>
      </div>
    </div>
  </header>
</template>
