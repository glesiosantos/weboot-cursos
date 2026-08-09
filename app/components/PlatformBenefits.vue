<template>
  <section class="border-y border-border bg-white">
    <div class="page-shell grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
      <div
        v-for="(item, index) in ['Cursos práticos', 'Certificados digitais', 'Aprendizado flexível', 'Acesso aos materiais']"
        :key="item"
        class="flex min-h-28 items-center gap-3 px-4 py-5 sm:justify-center"
      >
        <span class="text-sm font-black text-primary-600">0{{ index + 1 }}</span><span class="text-sm font-bold text-ink">{{ item }}</span>
      </div>
    </div>
  </section>
</template>
