<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type StudentOrder = { id: string, status: string, total: number, created_at: string, expires_at: string | null, asaas_checkout_url: string | null, courses: { title: string } | null }
const { data: orders } = await useFetch<StudentOrder[]>('/api/student/orders')
const canContinue = (order: StudentOrder) => order.status === 'WAITING_PAYMENT' && order.asaas_checkout_url && order.expires_at && new Date(order.expires_at).getTime() > Date.now()
</script>

<template>
  <section>
    <AppBadge>PEDIDOS</AppBadge><h1 class="mt-4 text-3xl font-black">
      Meus pedidos
    </h1><div class="mt-7 space-y-4">
      <article
        v-for="order in orders"
        :key="order.id"
        class="rounded-card border border-border bg-white p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="font-extrabold">
              {{ order.courses?.title }}
            </h2><p class="mt-1 text-sm text-muted">
              {{ new Date(order.created_at).toLocaleString('pt-BR') }} · {{ formatPrice(Number(order.total)) }}
            </p><AppBadge class="mt-3">
              {{ order.status }}
            </AppBadge>
          </div><AppButton
            v-if="canContinue(order)"
            :to="order.asaas_checkout_url || ''"
            external
          >
            Continuar pagamento
          </AppButton><AppButton
            v-else-if="order.status === 'PAID'"
            to="/aluno/cursos"
          >
            Acessar curso
          </AppButton>
        </div>
      </article><p
        v-if="!orders?.length"
        class="rounded-card border border-dashed border-border p-8 text-center text-muted"
      >
        Nenhum pedido encontrado.
      </p>
    </div>
  </section>
</template>
