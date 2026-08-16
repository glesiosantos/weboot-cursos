<script setup lang="ts">
const route = useRoute()
const reference = computed(() => typeof route.query.referencia === 'string' ? route.query.referencia : '')
const { data: registration, refresh } = await useFetch<{ status: string }>(() => `/api/registrations/${encodeURIComponent(reference.value)}`, { immediate: Boolean(reference.value) })
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(async () => { await refresh(); if (registration.value?.status === 'PAID') { await navigateTo(`/inscricao/${reference.value}/confirmada`) } }, 3000) })
onBeforeUnmount(() => { if (timer) { clearInterval(timer) } })
</script>

<template>
  <main class="page-shell py-16">
    <section class="mx-auto max-w-xl rounded-card border border-border bg-white p-8 text-center">
      <h1 class="text-3xl font-black">
        Estamos confirmando sua inscrição.
      </h1>
      <p class="mt-4 text-muted">
        A confirmação depende do webhook seguro do meio de pagamento. Você pode manter esta página aberta.
      </p>
    </section>
  </main>
</template>
