<template>
  <section class="bg-white pb-20">
    <div class="page-shell">
      <div class="relative overflow-hidden rounded-[1.75rem] bg-primary-600 px-6 py-14 text-center text-white sm:px-12">
        <div class="absolute -left-20 -top-20 size-52 rounded-full border-[40px] border-white/5" />
        <h2 class="text-3xl font-black tracking-tight sm:text-4xl">
          Pronto para dar o próximo passo?
        </h2><p class="relative mt-4 text-primary-100">
          Encontre um curso e comece a desenvolver novas habilidades hoje mesmo.
        </p><AppButton
          to="/cursos"
          variant="secondary"
          class="relative mt-7"
        >
          Explorar cursos
        </AppButton>
      </div>
    </div>
  </section>
</template>
