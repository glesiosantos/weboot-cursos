<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Administração | WeBoot Cursos', robots: 'noindex' })
type Dashboard = {
  summary: { revenue: number, paidOrders: number, pendingOrders: number, averageTicket: number }
  byCourse: { courseId: string, title: string, sales: number, revenue: number }[]
  recentSales: { id: string, courseTitle: string, total: number, paidAt: string }[]
}
const { data: dashboard, pending, error, refresh } = await useFetch<Dashboard>('/api/admin/dashboard')
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const cards = computed(() => [
  { label: 'Receita confirmada', value: money(dashboard.value?.summary.revenue ?? 0) },
  { label: 'Vendas pagas', value: String(dashboard.value?.summary.paidOrders ?? 0) },
  { label: 'Aguardando pagamento', value: String(dashboard.value?.summary.pendingOrders ?? 0) },
  { label: 'Ticket médio', value: money(dashboard.value?.summary.averageTicket ?? 0) },
])
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <AppBadge>VENDAS</AppBadge><h1 class="mt-4 text-3xl font-black">
          Dashboard comercial
        </h1><p class="mt-2 text-muted">
          Acompanhe pagamentos confirmados e o desempenho de cada curso.
        </p>
      </div><AppButton
        variant="secondary"
        :disabled="pending"
        @click="refresh()"
      >
        Atualizar
      </AppButton>
    </div>
    <p
      v-if="error"
      role="alert"
      class="mt-6 rounded-xl bg-red-50 p-4 text-danger"
    >
      Não foi possível carregar o dashboard.
    </p>
    <div class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="item in cards"
        :key="item.label"
        class="rounded-card border border-border bg-white p-6"
      >
        <p class="text-sm font-bold text-muted">
          {{ item.label }}
        </p><p class="mt-3 text-2xl font-black text-ink">
          {{ pending ? '—' : item.value }}
        </p>
      </article>
    </div><div class="mt-8 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <section class="rounded-card border border-border bg-white p-6">
        <h2 class="text-xl font-black">
          Vendas por curso
        </h2>
        <div
          v-if="dashboard?.byCourse.length"
          class="mt-5 space-y-4"
        >
          <div
            v-for="course in dashboard.byCourse"
            :key="course.courseId"
            class="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0"
          >
            <div>
              <p class="font-bold">
                {{ course.title }}
              </p><p class="text-sm text-muted">
                {{ course.sales }} venda(s)
              </p>
            </div><p class="font-black text-primary-700">
              {{ money(course.revenue) }}
            </p>
          </div>
        </div>
        <p
          v-else
          class="mt-5 text-muted"
        >
          Nenhuma venda confirmada ainda.
        </p>
      </section><section class="rounded-card border border-border bg-white p-6">
        <h2 class="text-xl font-black">
          Vendas recentes
        </h2>
        <div class="mt-5 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th class="pb-3">
                  Curso
                </th><th class="pb-3">
                  Data
                </th><th class="pb-3 text-right">
                  Valor
                </th>
              </tr>
            </thead><tbody>
              <tr
                v-for="sale in dashboard?.recentSales"
                :key="sale.id"
                class="border-t border-border"
              >
                <td class="py-3 font-bold">
                  {{ sale.courseTitle }}
                </td><td class="py-3 text-muted">
                  {{ date(sale.paidAt) }}
                </td><td class="py-3 text-right font-bold">
                  {{ money(sale.total) }}
                </td>
              </tr>
            </tbody>
          </table><p
            v-if="!dashboard?.recentSales.length"
            class="py-4 text-muted"
          >
            Nenhuma venda confirmada ainda.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>
