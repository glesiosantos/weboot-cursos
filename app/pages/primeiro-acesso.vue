<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: 'auth' })
useSeoMeta({ title: 'Primeiro acesso | WeBoot Cursos', robots: 'noindex, nofollow' })
</script>

<template>
  <section class="mx-auto w-full max-w-2xl">
    <AppBadge>PRIMEIRO ACESSO</AppBadge>
    <h1 class="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
      Crie sua nova senha
    </h1>
    <p class="mt-3 text-muted">
      Por segurança, substitua a senha inicial recebida por e-mail antes de acessar o painel do aluno.
    </p>
    <div class="mt-8">
      <AccountChangePasswordForm initial-access />
    </div>
  </section>
</template>
