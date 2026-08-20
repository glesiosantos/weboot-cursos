<template>
  <section class="relative overflow-hidden bg-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,#dbeafe_0,transparent_32%)]" />
    <div class="page-shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-24 xl:py-28">
      <div>
        <AppBadge>CURSOS PRÁTICOS • ONLINE E PRESENCIAL</AppBadge>
        <h1 class="mt-6 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-7xl">
          Conhecimento<br>que transforma<br>sua <span class="text-primary-600">carreira.</span>
        </h1>
        <p class="mt-7 max-w-xl text-lg leading-8 text-muted">
          Cursos desenvolvidos para quem quer aprender, praticar e aplicar o conhecimento no mundo real.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <AppButton to="/cursos">
            Explorar cursos <span aria-hidden="true">→</span>
          </AppButton><AppButton
            to="#como-funciona"
            variant="secondary"
          >
            Conhecer a plataforma
          </AppButton>
        </div>
        <ul class="mt-8 flex flex-col gap-3 text-sm font-semibold text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
          <li
            v-for="item in ['Certificado verificável', 'Conteúdo prático', 'Online e presencial']"
            :key="item"
            class="flex items-center gap-2"
          >
            <span class="grid size-5 place-items-center rounded-full bg-primary-50 text-xs text-primary-600">✓</span>{{ item }}
          </li>
        </ul>
      </div>
      <!-- Exemplo visual estático: não representa nem consulta dados reais do aluno. -->
      <div
        class="relative mx-auto w-full max-w-xl"
        aria-label="Exemplo visual do painel do aluno"
      >
        <div class="absolute -left-8 top-12 size-24 rounded-full bg-accent-400/20 blur-2xl" />
        <div class="relative rounded-[1.75rem] border border-primary-100 bg-white p-3 shadow-soft sm:p-4">
          <div class="overflow-hidden rounded-[1.3rem] bg-ink text-white">
            <div class="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-primary-500" /><span class="text-xs font-bold tracking-[.16em] text-primary-100">MEU APRENDIZADO</span>
              </div><span class="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-bold">WB</span>
            </div>
            <div class="p-5 sm:p-7">
              <div class="rounded-2xl bg-white p-5 text-ink shadow-lg shadow-black/10">
                <div class="flex items-start gap-4">
                  <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <svg
                      aria-hidden="true"
                      class="size-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    ><path d="m5 4 14 8-14 8V4Z" /></svg>
                  </div><div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-primary-600">
                      CURSO ONLINE
                    </p><p class="mt-1 font-extrabold">
                      Destravando SQL
                    </p><div class="mt-5 h-2 overflow-hidden rounded-full bg-border">
                      <div class="h-full w-[72%] rounded-full bg-primary-600" />
                    </div><div class="mt-2 flex justify-between text-xs text-muted">
                      <span>Progresso</span><b class="text-primary-600">72%</b>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-4">
                <div class="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p class="text-xs text-primary-100">
                    Próxima aula
                  </p><p class="mt-2 text-sm font-bold">
                    Consultas avançadas
                  </p>
                </div><div class="rounded-2xl bg-accent-500 p-4">
                  <p class="text-xs font-bold text-indigo-100">
                    Certificados
                  </p><p class="mt-1 text-3xl font-black">
                    2
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-3 text-center text-[11px] text-muted">
          Demonstração visual da plataforma
        </p>
      </div>
    </div>
  </section>
</template>
