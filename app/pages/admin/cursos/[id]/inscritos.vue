<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const courseId = String(route.params.id)
type Participant = { id: string, enrollmentId: string | null, name: string, email: string, registeredAt: string, paymentStatus: string, total: number, enrollmentStatus: string | null, eventCredentials: { code: string, status: string }[], attendance: { status: string }[], preparation: { required: number, completed: number } }
type CourseDashboard = {
  course: { id: string, title: string, course_type: string, status: string }
  summary: { registrations: number, enrolled: number, paid: number, pending: number, revenue: number, credentials: number, checkedIn: number, batchSales: Record<string, number> }
  participants: Participant[]
}
const { data: dashboard, refresh, pending, error } = await useFetch<CourseDashboard>(`/api/admin/courses/${courseId}/participants`)
const search = ref('')
const status = ref<'TODOS' | 'PAID' | 'WAITING_PAYMENT' | 'PENDING' | 'EXPIRED' | 'CANCELED' | 'REFUNDED'>('TODOS')
const removingId = ref<string | null>(null)
const notifyingId = ref<string | null>(null)
const actionMessage = ref('')
const actionError = ref('')
const filtered = computed(() => (dashboard.value?.participants ?? []).filter((item) => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  const matchesTerm = !term || `${item.name} ${item.email} ${item.eventCredentials[0]?.code ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)
  return matchesTerm && (status.value === 'TODOS' || item.paymentStatus === status.value)
}))
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
const resend = async (enrollmentId: string, type: 'ENROLLMENT_CONFIRMATION' | 'EVENT_CREDENTIAL' | 'PASSWORD_SETUP') => {
  notifyingId.value = enrollmentId
  actionMessage.value = ''
  actionError.value = ''
  try {
    const result = await $fetch<{ sentChannels: string[], skippedChannels: string[] }>(`/api/admin/courses/${courseId}/participants/${enrollmentId}/notify`, { method: 'POST', body: { type } })
    const channels = result.sentChannels.map(channel => channel === 'EMAIL' ? 'e-mail' : 'WhatsApp').join(' e ')
    const label = type === 'EVENT_CREDENTIAL' ? 'Credencial reenviada' : type === 'PASSWORD_SETUP' ? 'Primeiro acesso reenviado' : 'Confirmação reenviada'
    actionMessage.value = `${label} por ${channels}.`
    if (result.skippedChannels.includes('WHATSAPP')) { actionMessage.value += ' WhatsApp não está configurado.' }
  }
  catch (error) {
    actionError.value = apiErrorMessage(error, 'Não foi possível reenviar a notificação.')
  }
  finally {
    notifyingId.value = null
  }
}
const removeParticipant = async (participant: Participant) => {
  if (!window.confirm(`Remover ${participant.name}? A inscrição, o pagamento, a matrícula e os dados de teste deste curso serão excluídos. Esta ação não pode ser desfeita.`)) { return }
  removingId.value = participant.id
  actionMessage.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/admin/courses/${courseId}/participants/${participant.id}`, { method: 'DELETE' })
    actionMessage.value = `${participant.name} foi removido. O email e o CPF podem ser usados em uma nova inscrição.`
    await refresh()
  }
  catch (error) {
    actionError.value = apiErrorMessage(error, 'Não foi possível remover o participante.')
  }
  finally {
    removingId.value = null
  }
}
const cards = computed(() => [
  { label: 'Inscrições recebidas', value: String(dashboard.value?.summary.registrations ?? 0) },
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
          Inscrições, pagamentos, matrículas, credenciais e presença deste curso.
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
      >Situação do pagamento</label><select
        id="enrollment-status"
        v-model="status"
        class="field !mt-0 sm:max-w-56"
      >
        <option value="TODOS">
          Todas as inscrições
        </option><option value="PAID">
          Pagas
        </option><option value="WAITING_PAYMENT">
          Aguardando pagamento
        </option><option value="PENDING">
          Pagamento não iniciado
        </option><option value="EXPIRED">
          Expiradas
        </option><option value="CANCELED">
          Canceladas
        </option><option value="REFUNDED">
          Reembolsadas
        </option>
      </select>
    </div>
    <p
      v-if="actionMessage"
      role="status"
      class="mt-4 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800"
    >
      {{ actionMessage }}
    </p>
    <p
      v-if="actionError"
      role="alert"
      class="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-danger"
    >
      {{ actionError }}
    </p>
    <div class="mt-5 grid gap-4 md:hidden">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="min-w-0 rounded-card border border-border bg-white p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="font-black">
              {{ item.name }}
            </h2>
            <p class="mt-1 break-all text-sm text-muted">
              {{ item.email }}
            </p>
          </div><AppBadge>{{ item.enrollmentStatus ?? 'Não matriculado' }}</AppBadge>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="font-bold text-muted">
              Inscrição
            </dt><dd>{{ date(item.registeredAt) }}</dd>
          </div>
          <div>
            <dt class="font-bold text-muted">
              Pagamento
            </dt><dd>{{ item.paymentStatus }}</dd>
          </div>
          <div>
            <dt class="font-bold text-muted">
              Credencial
            </dt><dd>{{ item.eventCredentials[0]?.status ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-bold text-muted">
              Check-in
            </dt><dd>{{ item.attendance.some(entry => entry.status === 'PRESENT') ? 'Realizado' : '—' }}</dd>
          </div>
          <div>
            <dt class="font-bold text-muted">
              Preparação
            </dt><dd>{{ item.preparation.completed }}/{{ item.preparation.required }}</dd>
          </div>
        </dl>
        <div class="mt-4 flex flex-col items-start gap-3 border-t border-border pt-4">
          <AppButton
            v-if="item.eventCredentials[0]?.status === 'ACTIVE'"
            :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.eventCredentials[0].code)}`"
            variant="secondary"
          >
            Entrada
          </AppButton>
          <button
            v-if="item.enrollmentId"
            class="text-left text-xs font-bold text-primary-700 underline"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'ENROLLMENT_CONFIRMATION')"
          >
            Reenviar confirmação
          </button>
          <button
            v-if="item.enrollmentId"
            class="text-left text-xs font-bold text-primary-700 underline"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'PASSWORD_SETUP')"
          >
            Reenviar primeiro acesso
          </button>
          <button
            v-if="item.enrollmentId"
            class="text-left text-xs font-bold text-primary-700 underline"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'EVENT_CREDENTIAL')"
          >
            Reenviar credencial
          </button>
          <button
            class="text-left text-xs font-bold text-danger underline disabled:opacity-60"
            :disabled="removingId === item.id"
            @click="removeParticipant(item)"
          >
            {{ removingId === item.id ? 'Removendo…' : 'Remover participante' }}
          </button>
        </div>
      </article>
      <p
        v-if="!filtered.length && !pending"
        class="rounded-card border border-border bg-white p-8 text-center text-muted"
      >
        Nenhuma inscrição encontrada com os filtros selecionados.
      </p>
    </div>
    <div class="mt-5 hidden overflow-x-auto rounded-card border border-border bg-white md:block">
      <table class="w-full min-w-[1050px] text-left text-sm">
        <thead class="bg-canvas text-xs uppercase text-muted">
          <tr>
            <th class="p-4">
              Aluno
            </th><th>Email</th><th>Inscrição</th><th>Pagamento</th><th>Matrícula</th><th>Preparação</th><th>Credencial</th><th>Check-in</th><th class="p-4">
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
              {{ item.name }}
            </td><td>{{ item.email }}</td><td>{{ date(item.registeredAt) }}</td><td>{{ item.paymentStatus }}</td><td><AppBadge>{{ item.enrollmentStatus ?? 'Não matriculado' }}</AppBadge></td><td>{{ item.preparation.completed }}/{{ item.preparation.required }}</td><td>{{ item.eventCredentials[0]?.status ?? '—' }}</td><td>{{ item.attendance.some(entry => entry.status === 'PRESENT') ? 'Realizado' : '—' }}</td><td class="p-4">
              <div class="flex flex-wrap gap-2">
                <AppButton
                  v-if="item.eventCredentials[0]?.status === 'ACTIVE'"
                  :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.eventCredentials[0].code)}`"
                  variant="secondary"
                >
                  Entrada
                </AppButton><button
                  v-if="item.enrollmentId"
                  class="text-xs font-bold text-primary-700 underline"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'ENROLLMENT_CONFIRMATION')"
                >
                  {{ notifyingId === item.enrollmentId ? 'Enviando…' : 'Reenviar confirmação' }}
                </button><button
                  v-if="item.enrollmentId"
                  class="text-xs font-bold text-primary-700 underline"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'PASSWORD_SETUP')"
                >
                  {{ notifyingId === item.enrollmentId ? 'Enviando…' : 'Reenviar primeiro acesso' }}
                </button><button
                  v-if="item.enrollmentId"
                  class="text-xs font-bold text-primary-700 underline"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'EVENT_CREDENTIAL')"
                >
                  {{ notifyingId === item.enrollmentId ? 'Enviando…' : 'Reenviar credencial' }}
                </button><button
                  class="text-xs font-bold text-danger underline disabled:cursor-wait disabled:opacity-60"
                  :disabled="removingId === item.id"
                  @click="removeParticipant(item)"
                >
                  {{ removingId === item.id ? 'Removendo…' : 'Remover participante' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table><p
        v-if="!filtered.length && !pending"
        class="p-8 text-center text-muted"
      >
        Nenhuma inscrição encontrada com os filtros selecionados.
      </p>
    </div><button
      class="mt-4 text-sm font-bold text-primary-700"
      @click="refresh()"
    >
      Atualizar dados
    </button>
  </section>
</template>
