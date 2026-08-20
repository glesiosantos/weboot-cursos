<script setup lang="ts">
const steps = [
  { title: 'Escolha seu curso', icon: 'M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2m0-1a2 2 0 0 1 2-2h12' },
  { title: 'Faça sua inscrição', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 0v6m3-3h-6' },
  { title: 'Aprenda na prática', icon: 'm5 3 14 9-14 9V3Zm0 9h14' },
  { title: 'Receba seu certificado', icon: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3 0v6l3-2 3 2v-6' },
]
</script>

<template>
  <section
    id="como-funciona"
    class="section-space bg-white"
  >
    <div class="page-shell">
      <SectionHeading
        eyebrow="Como funciona"
        title="Aprender ficou simples"
        description="Uma jornada clara, da escolha do curso à conquista do certificado."
        align="center"
      />
      <div class="relative mt-14 grid gap-8 md:grid-cols-4">
        <div class="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-primary-100 md:block" />
        <article
          v-for="(step, index) in steps"
          :key="step.title"
          class="relative flex gap-5 md:block md:text-center"
        >
          <div class="relative z-10 grid size-16 shrink-0 place-items-center rounded-full border border-primary-100 bg-primary-50 text-primary-600 shadow-sm md:mx-auto">
            <svg
              aria-hidden="true"
              class="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            ><path :d="step.icon" /></svg><span class="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-primary-600 text-[10px] font-black text-white">{{ index + 1 }}</span>
          </div>
          <div>
            <h3 class="mt-1 text-lg font-extrabold md:mt-5">
              {{ step.title }}
            </h3><p class="mt-2 text-sm leading-6 text-muted">
              {{ ['Encontre a formação ideal para o seu momento.', 'Garanta sua vaga de forma simples e segura.', 'Aplique o conhecimento em situações reais.', 'Comprove sua evolução com validação online.'][index] }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
