<script setup lang="ts">
const benefits = [
  { label: 'Cursos práticos', path: 'M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2m0-1a2 2 0 0 1 2-2h12' },
  { label: 'Certificados digitais', path: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3 0v6l3-2 3 2v-6' },
  { label: 'Aprendizado flexível', path: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { label: 'Acesso aos materiais', path: 'M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z' },
]
</script>

<template>
  <section
    class="border-y border-border bg-white"
    aria-label="Benefícios da plataforma"
  >
    <div class="page-shell grid grid-cols-2 sm:grid-cols-4">
      <div
        v-for="(item, index) in benefits"
        :key="item.label"
        class="flex min-h-32 items-center gap-3 border-border px-3 py-5 odd:border-r max-sm:border-b sm:border-r sm:px-5 sm:last:border-r-0"
      >
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600"><svg
          aria-hidden="true"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        ><path :d="item.path" /></svg></span><div>
          <span class="text-[10px] font-black tracking-widest text-primary-600">0{{ index + 1 }}</span><p class="mt-1 text-sm font-bold text-ink">
            {{ item.label }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
