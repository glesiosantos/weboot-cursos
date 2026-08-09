<template>
  <section class="overflow-hidden">
    <div class="page-shell grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div>
        <AppBadge>CURSOS PRÁTICOS • ONLINE E PRESENCIAL</AppBadge><h1 class="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-7xl">
          Conhecimento prático para transformar sua <span class="text-primary-600">carreira.</span>
        </h1><p class="mt-6 max-w-xl text-lg leading-8 text-muted">
          Cursos desenvolvidos para quem quer aprender, praticar e aplicar o conhecimento no mundo real.
        </p><div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <AppButton to="/cursos">
            Explorar cursos <span aria-hidden="true">→</span>
          </AppButton><AppButton
            to="#como-funciona"
            variant="secondary"
          >
            Conhecer a plataforma
          </AppButton>
        </div><ul class="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted">
          <li>✓ Certificado verificável</li><li>✓ Conteúdo prático</li><li>✓ Online e presencial</li>
        </ul>
      </div><div class="relative mx-auto w-full max-w-xl">
        <div class="absolute -inset-8 -z-10 rounded-full bg-primary-100/60 blur-3xl" /><div class="rounded-[1.75rem] border border-border bg-white p-3 shadow-soft">
          <div class="rounded-[1.3rem] bg-ink p-5 text-white sm:p-7">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold tracking-widest text-primary-100">MEU APRENDIZADO</span><span class="size-8 rounded-full bg-primary-500" />
            </div><div class="mt-7 rounded-2xl bg-white p-5 text-ink">
              <div class="flex items-start gap-4">
                <div class="grid size-14 shrink-0 place-items-center rounded-xl bg-primary-50 text-2xl">
                  ⌘
                </div><div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-primary-600">
                    CURSO ONLINE
                  </p><p class="mt-1 font-extrabold">
                    Destravando SQL
                  </p><div class="mt-4 h-2 overflow-hidden rounded-full bg-border">
                    <div class="h-full w-[72%] rounded-full bg-primary-500" />
                  </div><div class="mt-2 flex justify-between text-xs text-muted">
                    <span>Progresso</span><b>72%</b>
                  </div>
                </div>
              </div>
            </div><div class="mt-4 grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p class="text-xs text-primary-100">
                  Próxima aula
                </p><p class="mt-2 text-sm font-bold">
                  Consultas avançadas
                </p>
              </div><div class="rounded-2xl bg-accent-400 p-4 text-ink">
                <p class="text-xs font-bold">
                  Certificados
                </p><p class="mt-1 text-3xl font-black">
                  2
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
