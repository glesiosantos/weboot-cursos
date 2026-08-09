<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white">
      <nav
        class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"
        aria-label="Principal"
      >
        <NuxtLink
          to="/"
          class="text-lg font-bold text-brand-700"
        >Weboot Cursos</NuxtLink>
        <div class="flex items-center gap-4 text-sm font-medium">
          <NuxtLink to="/cursos">Cursos</NuxtLink>
          <NuxtLink to="/login">Entrar</NuxtLink>
        </div>
      </nav>
    </header>
    <main><slot /></main>
  </div>
</template>
