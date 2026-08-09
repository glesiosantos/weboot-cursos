<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: 'auth' })
useSeoMeta({ title: 'Segurança da conta | WeBoot Cursos', robots: 'noindex, nofollow' })
</script>

<template>
  <section class="mx-auto w-full max-w-2xl">
    <AppBadge>MINHA CONTA</AppBadge>
    <h1 class="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
      Segurança da conta
    </h1>
    <p class="mt-3 text-muted">
      Gerencie sua senha e mantenha sua conta protegida.
    </p>
    <div class="mt-8">
      <AccountChangePasswordForm />
    </div>
  </section>
</template>
