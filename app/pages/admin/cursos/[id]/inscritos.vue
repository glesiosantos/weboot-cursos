<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const courseId = String(route.params.id)
type Participant = { id: string, email: string, status: string, enrolled_at: string, profiles: { name: string } | null, orders: { status: string, total: number } | null, event_credentials: { code: string, status: string }[], attendance: { status: string }[] }
type CourseDashboard = {
  course: { id: string, title: string, course_type: string, status: string }
  summary: { enrolled: number, paid: number, pending: number, revenue: number, credentials: number, checkedIn: number, batchSales: Record<string, number> }
  participants: Participant[]
}
const { data: dashboard, refresh, pending, error } = await useFetch<CourseDashboard>(`/api/admin/courses/${courseId}/participants`)
const search = ref('')
const status = ref<'TODOS' | 'ACTIVE' | 'PENDING' | 'CANCELED'>('TODOS')
const filtered = computed(() => (dashboard.value?.participants ?? []).filter((item) => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  const matchesTerm = !term || `${item.profiles?.name ?? ''} ${item.email} ${item.event_credentials?.[0]?.code ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)
  return matchesTerm && (status.value === 'TODOS' || item.status === status.value)
}))
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
const resend = async (enrollmentId: string, type: 'ENROLLMENT_CONFIRMATION' | 'EVENT_CREDENTIAL') => {
  await $fetch(`/api/admin/courses/${courseId}/participants/${enrollmentId}/notify`, { method: 'POST', body: { type } })
}
const cards = computed(() => [
  { label: 'Alunos ativos', value: String(dashboard.value?.summary.enrolled ?? 0) },
  { label: 'Receita confirmada', value: money(dashboard.value?.summary.revenue ?? 0) },
  { label: 'Pagamentos confirmados', value: String(dashboard.value?.summary.paid ?? 0) },
  { label: 'Aguardando pagamento', value: String(dashboard.value?.summary.pending ?? 0) },
  { label: 'Credenciais ativas', value: String(dashboard.value?.summary.credentials ?? 0) },
  { label: 'Check-ins realizados', value: String(dashboard.value?.summary.checkedIn ?? 0) },
])
useSeoMeta({ title: () => `${dashboard.value?.course.title ?? 'Curso'} | Alunos`, robots: 'noindex' })
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <NuxtLink
          to="/admin/cursos"
          class="text-sm font-bold text-primary-700"
        >← Cursos</NuxtLink>
        <div class="mt-4">
          <AppBadge>DASHBOARD DA TURMA</AppBadge>
        </div>
        <h1 class="mt-3 text-3xl font-black">
          {{ dashboard?.course.title ?? 'Alunos do curso' }}
        </h1>
        <p class="mt-2 text-muted">
          Matrículas, pagamentos, credenciais e presença deste curso.
        </p>
      </div><div class="flex flex-wrap gap-3">
        <AppButton :to="`/admin/cursos/${courseId}/checkin`">
          Check-in
        </AppButton>
        <AppButton
          :to="`/api/admin/courses/${courseId}/participants?format=csv`"
          external
          variant="secondary"
        >
          Exportar CSV
        </AppButton>
      </div>
    </div>
    <p
      v-if="error"
      role="alert"
      class="mt-6 rounded-xl bg-red-50 p-4 text-danger"
    >
      Não foi possível carregar os alunos deste curso.
    </p>
    <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in cards"
        :key="item.label"
        class="rounded-card border border-border bg-white p-5"
      >
        <p class="text-sm font-bold text-muted">
          {{ item.label }}
        </p><p class="mt-2 text-2xl font-black">
          {{ pending ? '—' : item.value }}
        </p>
      </article>
    </div>
    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
      <label
        class="sr-only"
        for="participant-search"
      >Buscar alunos</label><input
        id="participant-search"
        v-model="search"
        type="search"
        class="field !mt-0 flex-1"
        placeholder="Buscar por nome, email ou código"
      >
      <label
        class="sr-only"
        for="enrollment-status"
      >Situação da matrícula</label><select
        id="enrollment-status"
        v-model="status"
        class="field !mt-0 sm:max-w-56"
      >
        <option value="TODOS">
          Todas as matrículas
        </option><option value="ACTIVE">
          Ativas
        </option><option value="PENDING">
          Pendentes
        </option><option value="CANCELED">
          Canceladas
        </option>
      </select>
    </div>
    <div class="mt-5 overflow-x-auto rounded-card border border-border bg-white">
      <table class="w-full min-w-[1050px] text-left text-sm">
        <thead class="bg-canvas text-xs uppercase text-muted">
          <tr>
            <th class="p-4">
              Aluno
            </th><th>Email</th><th>Inscrição</th><th>Pagamento</th><th>Matrícula</th><th>Credencial</th><th>Check-in</th><th class="p-4">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filtered"
            :key="item.id"
            class="border-t border-border"
          >
            <td class="p-4 font-bold">
              {{ item.profiles?.name || 'Aluno' }}
            </td><td>{{ item.email }}</td><td>{{ date(item.enrolled_at) }}</td><td>{{ item.orders?.status ?? '—' }}</td><td><AppBadge>{{ item.status }}</AppBadge></td><td>{{ item.event_credentials?.[0]?.status ?? '—' }}</td><td>{{ item.attendance?.some(entry => entry.status === 'PRESENT') ? 'Realizado' : '—' }}</td><td class="p-4">
              <div class="flex flex-wrap gap-2">
                <AppButton
                  v-if="item.event_credentials?.[0]?.status === 'ACTIVE'"
                  :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.event_credentials[0].code)}`"
                  variant="secondary"
                >
                  Entrada
                </AppButton><button
                  class="text-xs font-bold text-primary-700 underline"
                  @click="resend(item.id, 'ENROLLMENT_CONFIRMATION')"
                >
                  Reenviar confirmação
                </button><button
                  class="text-xs font-bold text-primary-700 underline"
                  @click="resend(item.id, 'EVENT_CREDENTIAL')"
                >
                  Reenviar credencial
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table><p
        v-if="!filtered.length && !pending"
        class="p-8 text-center text-muted"
      >
        Nenhum aluno encontrado com os filtros selecionados.
      </p>
    </div><button
      class="mt-4 text-sm font-bold text-primary-700"
      @click="refresh()"
    >
      Atualizar dados
    </button>
  </section>
</template>
