<template>
  <section
    id="certificados"
    class="section-space"
  >
    <div class="page-shell">
      <div class="overflow-hidden rounded-[1.75rem] bg-primary-600 p-7 text-white sm:p-12 lg:grid lg:grid-cols-[1fr_.8fr] lg:items-center lg:gap-12">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[.18em] text-primary-100">
            Certificados verificáveis
          </p><h2 class="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">
            Seu conhecimento também pode ser comprovado.
          </h2><p class="mt-5 max-w-xl leading-7 text-primary-100">
            Cada certificado terá código único, QR Code e consulta pública para uma validação simples e confiável.
          </p><AppButton
            to="/certificados"
            variant="secondary"
            class="mt-8"
          >
            Validar certificado
          </AppButton>
        </div><div class="mt-10 rotate-1 rounded-2xl bg-white p-6 text-ink lg:mt-0">
          <div class="flex justify-between">
            <AppLogo /><span class="grid size-16 place-items-center border border-border font-mono text-xs">QR<br>CODE</span>
          </div><p class="mt-10 text-xs font-bold text-muted">
            CERTIFICADO DE CONCLUSÃO
          </p><p class="mt-3 text-2xl font-black">
            Formação prática
          </p><div class="mt-8 border-t border-border pt-4 text-xs text-muted">
            Código de validação • WB-DEMO-2026
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
