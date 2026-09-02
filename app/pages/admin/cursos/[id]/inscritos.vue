<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const courseId = String(route.params.id)
type Participant = { id: string, enrollmentId: string | null, name: string, email: string, phone: string, registeredAt: string, paymentStatus: string, total: number, enrollmentStatus: string | null, eventCredentials: { code: string, status: string }[], attendance: { status: string }[] }
type CourseDashboard = {
  course: { id: string, title: string, course_type: string, status: string }
  summary: { registrations: number, enrolled: number, paid: number, pending: number, revenue: number, credentials: number, checkedIn: number, batchSales: Record<string, number> }
  participants: Participant[]
  canManualEnroll: boolean
}
const { data: dashboard, refresh, pending, error } = await useFetch<CourseDashboard>(`/api/admin/courses/${courseId}/participants`)
const search = ref('')
const status = ref<'TODOS' | 'PAID' | 'WAITING_PAYMENT' | 'PENDING' | 'EXPIRED' | 'CANCELED' | 'REFUNDED'>('TODOS')
const removingId = ref<string | null>(null)
const notifyingId = ref<string | null>(null)
const actionMessage = ref('')
const actionError = ref('')
const showManualEnrollment = ref(false)
const creatingEnrollment = ref(false)
const manualEnrollment = reactive({ full_name: '', cpf: '', email: '', whatsapp: '', payment_method: 'PIX' as 'PIX' | 'TRANSFER' | 'CASH' | 'OTHER', payment_reference: '', amount_received: '', customer_authorized: false })
const selectedParticipant = ref<Participant | null>(null)
const confirmingPayment = ref(false)
const loadingPixId = ref<string | null>(null)
const paymentConfirmation = reactive({ payment_method: 'PIX' as 'PIX' | 'TRANSFER' | 'CASH' | 'OTHER', payment_reference: '', amount_received: '', customer_authorized: false })
const pix = ref<{ paymentId: string, encodedImage: string, payload: string, expirationDate?: string } | null>(null)
const filtered = computed(() => (dashboard.value?.participants ?? []).filter((item) => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  const matchesTerm = !term || `${item.name} ${item.email} ${item.phone} ${item.eventCredentials[0]?.code ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)
  return matchesTerm && (status.value === 'TODOS' || item.paymentStatus === status.value)
}))
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
const phone = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (digits.length === 11) { return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') }
  if (digits.length === 10) { return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3') }
  return value || '—'
}
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
const createManualEnrollment = async () => {
  creatingEnrollment.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/admin/courses/${courseId}/participants/manual-enrollment`, { method: 'POST', body: manualEnrollment })
    actionMessage.value = `${manualEnrollment.full_name} foi matriculado. As notificações de acesso e confirmação foram processadas.`
    Object.assign(manualEnrollment, { full_name: '', cpf: '', email: '', whatsapp: '', payment_method: 'PIX', payment_reference: '', amount_received: '', customer_authorized: false })
    showManualEnrollment.value = false
    await refresh()
  }
  catch (error) {
    actionError.value = apiErrorMessage(error, 'Não foi possível realizar a matrícula avulsa.')
  }
  finally {
    creatingEnrollment.value = false
  }
}
const openPaymentConfirmation = (participant: Participant) => {
  selectedParticipant.value = participant
  pix.value = null
  Object.assign(paymentConfirmation, { payment_method: 'PIX', payment_reference: '', amount_received: participant.total.toFixed(2), customer_authorized: false })
}
const closeParticipantAction = () => {
  if (confirmingPayment.value || loadingPixId.value) { return }
  selectedParticipant.value = null
  pix.value = null
}
const confirmParticipantPayment = async () => {
  if (!selectedParticipant.value) { return }
  confirmingPayment.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    await $fetch(String(`/api/admin/courses/${courseId}/participants/${selectedParticipant.value.id}/confirm-payment`), { method: 'POST', body: paymentConfirmation })
    actionMessage.value = `${selectedParticipant.value.name} teve o pagamento confirmado e foi matriculado.`
    selectedParticipant.value = null
    await refresh()
  }
  catch (error) {
    actionError.value = apiErrorMessage(error, 'Não foi possível confirmar o pagamento deste aluno.')
  }
  finally {
    confirmingPayment.value = false
  }
}
const loadParticipantPix = async (participant: Participant) => {
  selectedParticipant.value = participant
  pix.value = null
  loadingPixId.value = participant.id
  actionMessage.value = ''
  actionError.value = ''
  try {
    pix.value = await $fetch<{ paymentId: string, encodedImage: string, payload: string, expirationDate?: string }>(String(`/api/admin/courses/${courseId}/participants/${participant.id}/pix`), { method: 'POST' })
    await refresh()
  }
  catch (error) {
    actionError.value = apiErrorMessage(error, 'Não foi possível obter o QR Code Pix.')
  }
  finally {
    loadingPixId.value = null
  }
}
const copyPix = async () => {
  if (!pix.value?.payload) { return }
  try {
    await navigator.clipboard.writeText(pix.value.payload)
    actionMessage.value = 'Código Pix copiado. Agora você pode enviá-lo ao aluno.'
  }
  catch {
    actionError.value = 'Não foi possível copiar automaticamente. Selecione o código Pix abaixo.'
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
        <AppButton
          v-if="dashboard?.canManualEnroll"
          variant="secondary"
          @click="showManualEnrollment = !showManualEnrollment"
        >
          Matrícula avulsa
        </AppButton>
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
    <form
      v-if="showManualEnrollment"
      class="mt-6 rounded-card border border-border bg-white p-5"
      @submit.prevent="createManualEnrollment"
    >
      <h2 class="text-xl font-black">
        Confirmar pagamento e matricular aluno
      </h2>
      <p class="mt-2 text-sm text-muted">
        Use somente quando o pagamento já foi recebido fora do checkout. O valor deve corresponder ao preço vigente do curso ou lote.
      </p>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label class="text-sm font-bold">Nome completo<input
          v-model="manualEnrollment.full_name"
          required
          minlength="6"
          maxlength="150"
          class="field"
          autocomplete="name"
        ></label>
        <label class="text-sm font-bold">CPF<input
          v-model="manualEnrollment.cpf"
          required
          class="field"
          inputmode="numeric"
          autocomplete="off"
          placeholder="000.000.000-00"
        ></label>
        <label class="text-sm font-bold">Email<input
          v-model="manualEnrollment.email"
          required
          type="email"
          class="field"
          autocomplete="email"
        ></label>
        <label class="text-sm font-bold">WhatsApp<input
          v-model="manualEnrollment.whatsapp"
          required
          class="field"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(00) 00000-0000"
        ></label>
        <label class="text-sm font-bold">Forma recebida<select
          v-model="manualEnrollment.payment_method"
          class="field"
        ><option value="PIX">Pix</option><option value="TRANSFER">Transferência</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></select></label>
        <label class="text-sm font-bold">Valor recebido<input
          v-model="manualEnrollment.amount_received"
          required
          type="number"
          min="0.01"
          step="0.01"
          class="field"
          inputmode="decimal"
          placeholder="0,00"
        ></label>
        <label class="text-sm font-bold md:col-span-2 xl:col-span-3">Referência/comprovante do pagamento<input
          v-model="manualEnrollment.payment_reference"
          required
          minlength="3"
          maxlength="100"
          class="field"
          autocomplete="off"
          placeholder="ID da transação ou identificação do comprovante"
        ></label>
      </div>
      <label class="mt-4 flex items-start gap-3 text-sm"><input
        v-model="manualEnrollment.customer_authorized"
        required
        type="checkbox"
        class="mt-1"
      ><span>Confirmo que o cliente autorizou o cadastro e que conferi o recebimento deste pagamento.</span></label>
      <div class="mt-5 flex flex-wrap gap-3">
        <AppButton
          type="submit"
          :disabled="creatingEnrollment"
        >
          {{ creatingEnrollment ? 'Matriculando...' : 'Confirmar pagamento e matricular' }}
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          :disabled="creatingEnrollment"
          @click="showManualEnrollment = false"
        >
          Cancelar
        </AppButton>
      </div>
    </form>
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
        placeholder="Buscar por nome, email, celular ou código"
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
    <div
      v-if="selectedParticipant"
      class="mt-5 rounded-card border border-border bg-white p-5"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-black">
            {{ pix ? 'Pix para enviar ao aluno' : 'Confirmar pagamento recebido' }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ selectedParticipant.name }} · {{ selectedParticipant.email }} · {{ money(selectedParticipant.total) }}
          </p>
        </div>
        <button
          type="button"
          class="text-sm font-bold text-primary-700"
          @click="closeParticipantAction"
        >
          Fechar
        </button>
      </div>
      <div
        v-if="pix"
        class="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]"
      >
        <img
          :src="`data:image/png;base64,${pix.encodedImage}`"
          alt="QR Code Pix"
          class="mx-auto size-60 rounded-xl border border-border bg-white p-2"
        >
        <div class="min-w-0">
          <label class="text-sm font-bold">Pix Copia e Cola<textarea
            :value="pix.payload"
            readonly
            rows="6"
            class="field break-all font-mono text-xs"
            @focus="($event.target as HTMLTextAreaElement).select()"
          /></label>
          <p
            v-if="pix.expirationDate"
            class="mt-2 text-sm text-muted"
          >
            Válido até {{ new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(pix.expirationDate)) }}.
          </p>
          <AppButton
            class="mt-4"
            type="button"
            @click="copyPix"
          >
            Copiar código Pix
          </AppButton>
        </div>
      </div>
      <form
        v-else
        class="mt-5"
        @submit.prevent="confirmParticipantPayment"
      >
        <p class="text-sm text-muted">
          Confirme somente após conferir o recebimento fora do checkout. Esta ação cria a matrícula e envia as notificações de acesso.
        </p>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <label class="text-sm font-bold">Forma recebida<select
            v-model="paymentConfirmation.payment_method"
            class="field"
          ><option value="PIX">Pix</option><option value="TRANSFER">Transferência</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></select></label>
          <label class="text-sm font-bold">Valor recebido<input
            v-model="paymentConfirmation.amount_received"
            required
            type="number"
            min="0.01"
            step="0.01"
            class="field"
          ></label>
          <label class="text-sm font-bold">Referência/comprovante<input
            v-model="paymentConfirmation.payment_reference"
            required
            minlength="3"
            maxlength="100"
            class="field"
          ></label>
        </div>
        <label class="mt-4 flex items-start gap-3 text-sm"><input
          v-model="paymentConfirmation.customer_authorized"
          required
          type="checkbox"
          class="mt-1"
        ><span>Confirmo que o cliente autorizou o cadastro e que conferi o recebimento deste pagamento.</span></label>
        <AppButton
          class="mt-4"
          type="submit"
          :disabled="confirmingPayment"
        >
          {{ confirmingPayment ? 'Confirmando...' : 'Confirmar e matricular' }}
        </AppButton>
      </form>
    </div>
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
            <p class="mt-1 text-sm text-muted">
              {{ phone(item.phone) }}
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
        </dl>
        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <AdminIconAction
            v-if="dashboard?.canManualEnroll && !item.enrollmentId && ['PENDING', 'WAITING_PAYMENT', 'EXPIRED'].includes(item.paymentStatus)"
            label="Confirmar pagamento e matricular"
            icon="payment"
            :disabled="confirmingPayment"
            @click="openPaymentConfirmation(item)"
          />
          <AdminIconAction
            v-if="dashboard?.canManualEnroll && !item.enrollmentId && ['PENDING', 'WAITING_PAYMENT'].includes(item.paymentStatus)"
            label="Obter QR Code Pix"
            icon="qrcode"
            :disabled="loadingPixId === item.id"
            @click="loadParticipantPix(item)"
          />
          <AdminIconAction
            v-if="item.eventCredentials[0]?.status === 'ACTIVE'"
            :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.eventCredentials[0].code)}`"
            label="Registrar entrada"
            icon="checkin"
          />
          <AdminIconAction
            v-if="item.enrollmentId"
            label="Reenviar confirmação"
            icon="bell"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'ENROLLMENT_CONFIRMATION')"
          />
          <AdminIconAction
            v-if="item.enrollmentId"
            label="Reenviar primeiro acesso"
            icon="key"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'PASSWORD_SETUP')"
          />
          <AdminIconAction
            v-if="item.enrollmentId"
            label="Reenviar credencial"
            icon="ticket"
            :disabled="notifyingId === item.enrollmentId"
            @click="resend(item.enrollmentId, 'EVENT_CREDENTIAL')"
          />
          <AdminIconAction
            label="Remover participante"
            icon="trash"
            danger
            :disabled="removingId === item.id"
            @click="removeParticipant(item)"
          />
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
            </th><th>Email</th><th>Celular</th><th>Inscrição</th><th>Pagamento</th><th>Matrícula</th><th>Credencial</th><th>Check-in</th><th class="p-4">
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
            </td><td>{{ item.email }}</td><td>{{ phone(item.phone) }}</td><td>{{ date(item.registeredAt) }}</td><td>{{ item.paymentStatus }}</td><td><AppBadge>{{ item.enrollmentStatus ?? 'Não matriculado' }}</AppBadge></td><td>{{ item.eventCredentials[0]?.status ?? '—' }}</td><td>{{ item.attendance.some(entry => entry.status === 'PRESENT') ? 'Realizado' : '—' }}</td><td class="p-4">
              <div class="flex flex-wrap gap-2">
                <AdminIconAction
                  v-if="dashboard?.canManualEnroll && !item.enrollmentId && ['PENDING', 'WAITING_PAYMENT', 'EXPIRED'].includes(item.paymentStatus)"
                  label="Confirmar pagamento e matricular"
                  icon="payment"
                  :disabled="confirmingPayment"
                  @click="openPaymentConfirmation(item)"
                /><AdminIconAction
                  v-if="dashboard?.canManualEnroll && !item.enrollmentId && ['PENDING', 'WAITING_PAYMENT'].includes(item.paymentStatus)"
                  label="Obter QR Code Pix"
                  icon="qrcode"
                  :disabled="loadingPixId === item.id"
                  @click="loadParticipantPix(item)"
                /><AdminIconAction
                  v-if="item.eventCredentials[0]?.status === 'ACTIVE'"
                  :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.eventCredentials[0].code)}`"
                  label="Registrar entrada"
                  icon="checkin"
                /><AdminIconAction
                  v-if="item.enrollmentId"
                  label="Reenviar confirmação"
                  icon="bell"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'ENROLLMENT_CONFIRMATION')"
                /><AdminIconAction
                  v-if="item.enrollmentId"
                  label="Reenviar primeiro acesso"
                  icon="key"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'PASSWORD_SETUP')"
                /><AdminIconAction
                  v-if="item.enrollmentId"
                  label="Reenviar credencial"
                  icon="ticket"
                  :disabled="notifyingId === item.enrollmentId"
                  @click="resend(item.enrollmentId, 'EVENT_CREDENTIAL')"
                /><AdminIconAction
                  label="Remover participante"
                  icon="trash"
                  danger
                  :disabled="removingId === item.id"
                  @click="removeParticipant(item)"
                />
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
