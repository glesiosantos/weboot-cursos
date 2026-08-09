<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border bg-white">
    <div class="page-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <AppLogo /><p class="mt-4 max-w-xs text-sm leading-6 text-muted">
          Capacitação prática para transformar conhecimento em novas possibilidades profissionais.
        </p>
      </div><div
        v-for="group in [{ title: 'Navegação', links: ['Cursos', 'Sobre', 'Certificados'] }, { title: 'Suporte', links: ['Contato', 'FAQ'] }, { title: 'Legal', links: ['Termos', 'Privacidade'] }]"
        :key="group.title"
      >
        <p class="font-bold">
          {{ group.title }}
        </p><ul class="mt-4 space-y-3 text-sm text-muted">
          <li
            v-for="link in group.links"
            :key="link"
          >
            <span>{{ link }}</span>
          </li>
        </ul>
      </div>
    </div><div class="border-t border-border">
      <div class="page-shell py-5 text-sm text-muted">
        © {{ year }} WeBoot Cursos. Todos os direitos reservados.
      </div>
    </div>
  </footer>
</template>
