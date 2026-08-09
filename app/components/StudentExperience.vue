<template>
  <section class="section-space bg-white">
    <div class="page-shell grid items-center gap-12 lg:grid-cols-2">
      <div>
        <SectionHeading
          eyebrow="Experiência do aluno"
          title="Tudo o que você aprende, em um só lugar."
          description="Acompanhe cursos, retome aulas e encontre seus certificados em uma área simples e organizada."
        /><AppButton
          to="/login"
          variant="secondary"
          class="mt-7"
        >
          Acessar minha conta
        </AppButton>
      </div><div class="rounded-[1.5rem] border border-border bg-canvas p-4 shadow-soft sm:p-6">
        <div class="flex items-center justify-between border-b border-border pb-5">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-primary-600">
              Painel
            </p><h3 class="mt-1 text-xl font-extrabold">
              Meu aprendizado
            </h3>
          </div><div class="rounded-xl bg-accent-400 px-4 py-2 text-center">
            <b class="block text-xl">2</b><span class="text-[10px] font-bold">CERTIFICADOS</span>
          </div>
        </div><div
          v-for="course in [{ name: 'Destravando SQL', value: 72 }, { name: 'API REST com NestJS', value: 34 }]"
          :key="course.name"
          class="mt-5 rounded-xl border border-border bg-white p-4"
        >
          <div class="flex justify-between text-sm">
            <b>{{ course.name }}</b><span class="font-bold text-primary-600">{{ course.value }}%</span>
          </div><div class="mt-3 h-2 rounded-full bg-border">
            <div
              class="h-full rounded-full bg-primary-500"
              :style="{ width: `${course.value}%` }"
            />
          </div>
        </div><p class="mt-4 text-xs text-muted">
          Demonstração visual — não representa dados reais.
        </p>
      </div>
    </div>
  </section>
</template>
