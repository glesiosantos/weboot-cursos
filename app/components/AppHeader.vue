<script setup lang="ts">
const open = ref(false)
const links = [{ label: 'Início', to: '/' }, { label: 'Cursos', to: '/cursos' }, { label: 'Sobre', to: '/#sobre' }, { label: 'Certificados', to: '/#certificados' }]
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/80 bg-canvas/95 backdrop-blur">
    <nav
      class="page-shell flex h-18 items-center justify-between"
      aria-label="Principal"
    >
      <AppLogo /><div class="hidden items-center gap-7 lg:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="text-sm font-semibold text-muted hover:text-primary-700"
        >{{ link.label }}</NuxtLink>
      </div><div class="hidden items-center gap-2 lg:flex">
        <AppButton
          to="/login"
          variant="ghost"
        >
          Entrar
        </AppButton><AppButton to="/cursos">
          Explorar cursos
        </AppButton>
      </div><button
        type="button"
        class="grid size-11 place-items-center rounded-xl border border-border bg-white lg:hidden"
        :aria-expanded="open"
        aria-label="Abrir menu"
        @click="open = !open"
      >
        <span class="text-xl">{{ open ? '×' : '☰' }}</span>
      </button>
    </nav><div
      v-if="open"
      class="border-t border-border bg-white px-5 py-5 lg:hidden"
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
