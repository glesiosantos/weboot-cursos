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
      /><div class="mt-12 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(step, index) in [{ t: 'Escolha seu curso', d: 'Encontre a modalidade e o conteúdo ideais para seu momento.' }, { t: 'Faça sua inscrição', d: 'Crie sua conta e garanta sua participação na turma.' }, { t: 'Aprenda no seu ritmo', d: 'Acesse aulas e materiais ou acompanhe os encontros presenciais.' }, { t: 'Receba seu certificado', d: 'Conclua a formação e comprove o conhecimento adquirido.' }]"
          :key="step.t"
          class="bg-canvas p-7"
        >
          <span class="text-sm font-black text-primary-600">0{{ index + 1 }}</span><h3 class="mt-8 text-lg font-extrabold">
            {{ step.t }}
          </h3><p class="mt-2 text-sm leading-6 text-muted">
            {{ step.d }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
