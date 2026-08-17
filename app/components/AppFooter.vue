<script setup lang="ts">
const year = new Date().getFullYear()
const groups = [
  { title: 'Navegação', links: [{ label: 'Cursos', to: '/cursos' }, { label: 'Sobre', to: '/#sobre' }, { label: 'Certificados', to: '/certificados' }, { label: 'Blog', to: '/#blog' }] },
  { title: 'Suporte', links: [{ label: 'Contato', to: '/#contato' }, { label: 'FAQ', to: '/#faq' }, { label: 'Central de ajuda', to: '/#ajuda' }] },
  { title: 'Legal', links: [{ label: 'Termos', to: '/#termos' }, { label: 'Privacidade', to: '/#privacidade' }, { label: 'Política de cookies', to: '/#cookies' }] },
]
</script>

<template>
  <footer class="bg-ink text-white">
    <div class="page-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
      <div class="[&_span:last-child]:!text-white">
        <AppLogo /><p class="mt-5 max-w-xs text-sm leading-6 text-slate-400">
          Capacitação prática para transformar conhecimento em novas possibilidades profissionais.
        </p>
      </div>
      <div
        v-for="group in groups"
        :key="group.title"
      >
        <p class="font-bold">
          {{ group.title }}
        </p><ul class="mt-5 space-y-3 text-sm text-slate-400">
          <li
            v-for="link in group.links"
            :key="link.label"
          >
            <NuxtLink
              :to="link.to"
              class="hover:text-white"
            >{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="page-shell py-6 text-sm text-slate-500">
        © {{ year }} WeBoot Cursos. Todos os direitos reservados.
      </div>
    </div>
  </footer>
</template>
