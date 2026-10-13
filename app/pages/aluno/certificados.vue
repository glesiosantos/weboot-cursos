<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type StudentCertificate = { id: string, number: string, verificationCode: string, issuedAt: string, courseTitle: string, downloadUrl: string }
const { data: certificates, error } = await useFetch<StudentCertificate[]>('/api/student/certificates')
</script>

<template>
  <section>
    <AppBadge>MEUS CERTIFICADOS</AppBadge>
    <h1 class="mt-4 text-3xl font-black">
      Certificados de conclusão
    </h1>
    <p class="mt-2 text-muted">
      Consulte e baixe os certificados emitidos para seus cursos.
    </p>
    <p
      v-if="error"
      role="alert"
      class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-danger"
    >
      Não foi possível carregar seus certificados.
    </p>
    <div
      v-else
      class="mt-7 grid gap-4 md:grid-cols-2"
    >
      <article
        v-for="certificate in certificates"
        :key="certificate.id"
        class="rounded-card border border-border bg-white p-6"
      >
        <AppBadge>CONCLUÍDO</AppBadge>
        <h2 class="mt-3 text-xl font-extrabold">
          {{ certificate.courseTitle }}
        </h2>
        <p class="mt-2 text-sm text-muted">
          Emitido em {{ new Date(certificate.issuedAt).toLocaleDateString('pt-BR') }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Certificado {{ certificate.number }}
        </p>
        <a
          class="mt-5 inline-flex rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white"
          :href="certificate.downloadUrl"
          target="_blank"
          rel="noopener"
        >Visualizar certificado</a>
      </article>
      <p
        v-if="!certificates?.length"
        class="text-muted"
      >
        Você ainda não possui certificados emitidos.
      </p>
    </div>
  </section>
</template>
