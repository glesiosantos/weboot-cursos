<script setup lang="ts">
// Conteúdo estático usado apenas para compor o mockup visual do painel.
const demoCourses = [{ name: 'Destravando SQL', value: 72 }, { name: 'API REST com NuxtJS', value: 84 }, { name: 'Figma do Zero ao Avançado', value: 40 }]
</script>

<template>
  <section class="section-space overflow-hidden bg-ink text-white">
    <div class="page-shell grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
      <div class="min-w-0">
        <p class="text-xs font-extrabold uppercase tracking-[.18em] text-primary-100">
          Experiência do aluno
        </p><h2 class="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">
          Tudo o que você aprende,<br>em um só lugar.
        </h2><p class="mt-5 max-w-xl leading-7 text-slate-300">
          Acompanhe seus cursos, retome aulas, baixe materiais e encontre seus certificados em uma área simples e organizada.
        </p><AppButton
          to="/login"
          variant="secondary"
          class="mt-8"
        >
          Acessar minha conta
        </AppButton>
      </div>
      <div
        class="min-w-0 rounded-[1.5rem] border border-white/15 bg-white/5 p-4 shadow-2xl shadow-black/20 sm:p-6"
        aria-label="Demonstração visual da área do aluno"
      >
        <div class="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-primary-100">
              Painel
            </p><h3 class="mt-1 text-xl font-extrabold">
              Meu aprendizado
            </h3>
          </div><span class="rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold"><span class="sm:hidden">Continuar</span><span class="hidden sm:inline">Continuar aprendendo</span></span>
        </div>
        <div
          v-for="course in demoCourses"
          :key="course.name"
          class="mt-4 rounded-xl bg-white p-4 text-ink"
        >
          <div class="flex gap-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600"><svg
              aria-hidden="true"
              class="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            ><path d="m7 4 13 8-13 8V4Z" /></svg></span><div class="min-w-0 flex-1">
              <div class="flex justify-between gap-3 text-sm">
                <b class="truncate">{{ course.name }}</b><span class="font-bold text-primary-600">{{ course.value }}%</span>
              </div><div class="mt-3 h-1.5 rounded-full bg-border">
                <div
                  class="h-full rounded-full bg-primary-600"
                  :style="{ width: `${course.value}%` }"
                />
              </div>
            </div>
          </div>
        </div>
        <p class="mt-4 text-xs text-slate-400">
          Demonstração visual — não representa dados reais.
        </p>
      </div>
    </div>
  </section>
</template>
