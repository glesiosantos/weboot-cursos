<template>
  <section
    id="certificados"
    class="section-space bg-white"
  >
    <div class="page-shell grid items-center gap-12 lg:grid-cols-2">
      <div>
        <SectionHeading
          eyebrow="Certificados verificáveis"
          title="Seu conhecimento tem valor."
          description="Todos os certificados possuem código único, QR Code e validação pública online."
        /><AppButton
          to="/certificados"
          class="mt-8"
        >
          Verificar certificado <span aria-hidden="true">→</span>
        </AppButton>
      </div>
      <!-- Certificado e QR Code abaixo são uma composição visual, sem código funcional. -->
      <div
        class="relative mx-auto w-full max-w-xl rounded-[1.4rem] border border-primary-100 bg-canvas p-4 shadow-soft sm:p-6"
        aria-label="Exemplo visual de certificado"
      >
        <div class="rounded-xl border border-primary-100 bg-white p-6 sm:p-9">
          <div class="flex items-start justify-between gap-4">
            <AppLogo /><span
              class="grid size-16 shrink-0 place-items-center bg-[repeating-linear-gradient(45deg,#0b1633_0_3px,#fff_3px_6px)] ring-4 ring-white"
              aria-hidden="true"
            />
          </div><div class="mt-12">
            <p class="text-xs font-bold uppercase tracking-[.18em] text-primary-600">
              Certificado de conclusão
            </p><p class="mt-3 text-3xl font-black tracking-tight text-ink">
              Formação prática
            </p><p class="mt-4 text-sm leading-6 text-muted">
              Certificamos a conclusão desta jornada de aprendizagem.
            </p>
          </div><div class="mt-10 flex items-end justify-between gap-4 border-t border-border pt-5">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                Código de validação
              </p><p class="mt-1 font-mono text-xs font-bold text-ink">
                WB-DEMO-2026
              </p>
            </div><svg
              aria-hidden="true"
              class="size-9 text-primary-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            ><circle
              cx="12"
              cy="12"
              r="9"
            /><path d="m8 12 2.5 2.5L16 9" /></svg>
          </div>
        </div>
        <p class="mt-3 text-center text-[11px] text-muted">
          Demonstração visual — certificado não emitido
        </p>
      </div>
    </div>
  </section>
</template>
