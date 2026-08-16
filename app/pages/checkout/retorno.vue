<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
const route = useRoute()
const orderId = computed(() => typeof route.query.pedido === 'string' ? route.query.pedido : '')
type OrderStatus = { status: 'PENDING' | 'WAITING_PAYMENT' | 'PAID' | 'CANCELED' | 'EXPIRED' | 'REFUNDED' }
const { data: order, refresh } = await useFetch<OrderStatus>(() => `/api/student/order/${orderId.value}`, { immediate: Boolean(orderId.value) })
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => refresh(), 3000) })
onBeforeUnmount(() => clearInterval(timer))
const message = computed(() => order.value?.status === 'PAID' ? 'Pagamento recebido' : order.value?.status === 'WAITING_PAYMENT' ? 'Pagamento aguardando confirmação' : 'Pagamento pendente')
</script>

<template>
  <section class="mx-auto max-w-xl rounded-card border border-border bg-white p-8 text-center">
    <AppBadge>RETORNO DO CHECKOUT</AppBadge><h1 class="mt-5 text-3xl font-black">
      {{ message }}
    </h1><p class="mt-3 text-muted">
      A liberação é feita somente após a confirmação segura do pagamento.
    </p><AppButton
      class="mt-7"
      to="/aluno/pedidos"
    >
      Ver meus pedidos
    </AppButton>
  </section>
</template>
