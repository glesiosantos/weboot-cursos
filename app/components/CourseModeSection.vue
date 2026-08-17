<script setup lang="ts">
const modes = [
  { badge: 'CURSOS ONLINE', title: 'Aprenda de onde estiver', items: ['Acesso pela plataforma', 'Aulas em vídeo', 'Materiais de apoio', 'Progresso acompanhado', 'Certificado digital'], dark: true },
  { badge: 'CURSOS PRESENCIAIS', title: 'Troque experiências ao vivo', items: ['Turmas com datas', 'Encontros presenciais', 'Materiais digitais', 'Acompanhamento', 'Certificado'], dark: false },
]
</script>

<template>
  <section
    id="sobre"
    class="section-space bg-canvas"
  >
    <div class="page-shell grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
      <div>
        <SectionHeading
          eyebrow="Do seu jeito"
          title="Online ou presencial. Você escolhe."
          description="Duas experiências de aprendizado, o mesmo compromisso com conteúdo útil e aplicável."
        /><AppButton
          to="/cursos"
          class="mt-7"
        >
          Encontrar meu curso <span aria-hidden="true">→</span>
        </AppButton>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <article
          v-for="mode in modes"
          :key="mode.badge"
          class="rounded-card border p-7 sm:p-8"
          :class="mode.dark ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink'"
        >
          <p
            class="text-xs font-black tracking-[.16em]"
            :class="mode.dark ? 'text-primary-100' : 'text-primary-600'"
          >
            {{ mode.badge }}
          </p><h3 class="mt-5 text-2xl font-extrabold tracking-tight">
            {{ mode.title }}
          </h3>
          <ul
            class="mt-8 space-y-4 text-sm"
            :class="mode.dark ? 'text-slate-200' : 'text-muted'"
          >
            <li
              v-for="item in mode.items"
              :key="item"
              class="flex items-center gap-3"
            >
              <span class="grid size-5 place-items-center rounded-full bg-primary-600 text-[10px] text-white">✓</span>{{ item }}
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>
