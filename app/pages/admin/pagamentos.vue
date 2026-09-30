<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
type TestSettings = { configured: boolean, publicKey: string }
type TestPayment = { payment_id: string, status: string, status_detail?: string, encoded_image?: string, payload?: string, ticket_url?: string }
const { data: settings, error: settingsError } = await useFetch<TestSettings>('/api/admin/payment-tests')
const method = ref<'PIX' | 'CREDIT_CARD'>('PIX')
const payer = reactive({ amount: 10, full_name: '', email: '', cpf: '' })
const payment = ref<TestPayment | null>(null)
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const requestBody = (extra: Record<string, unknown> = {}) => ({ ...payer, cpf: payer.cpf.replace(/\D/g, ''), ...extra })

const createPixTest = async () => {
  loading.value = true
  message.value = ''
  errorMessage.value = ''
  payment.value = null
  try {
    payment.value = await $fetch<TestPayment>('/api/admin/payment-tests', { method: 'POST', body: requestBody({ method: 'PIX' }) })
    message.value = 'Cobrança Pix criada no ambiente de testes do Mercado Pago.'
  }
  catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível criar o Pix de teste.'
  }
  finally { loading.value = false }
}

const createCardTest = async (card: { token: string, payment_method_id: string, issuer_id?: string, installments: number }) => {
  loading.value = true
  message.value = ''
  errorMessage.value = ''
  payment.value = null
  try {
    payment.value = await $fetch<TestPayment>('/api/admin/payment-tests', {
      method: 'POST', body: requestBody({ method: 'CREDIT_CARD', ...card }),
    })
    message.value = 'Pagamento enviado ao ambiente de testes do Mercado Pago.'
  }
  catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível criar o pagamento de teste.'
  }
  finally { loading.value = false }
}

const refreshStatus = async () => {
  if (!payment.value) { return }
  loading.value = true
  try {
    const updated = await $fetch<TestPayment>(`/api/admin/payment-tests/${encodeURIComponent(payment.value.payment_id)}`)
    payment.value = { ...payment.value, ...updated }
    message.value = 'Situação atualizada no Mercado Pago.'
  }
  catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível consultar o pagamento.'
  }
  finally { loading.value = false }
}

const copyPix = async () => {
  if (payment.value?.payload) { await navigator.clipboard.writeText(payment.value.payload); message.value = 'Código Pix copiado.' }
}
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <AppBadge>ADMINISTRAÇÃO</AppBadge>
    <h1 class="mt-4 text-3xl font-black">
      Testar pagamentos
    </h1>
    <p class="mt-3 max-w-2xl text-muted">
      Simule cobranças Pix e cartão usando as credenciais de teste do Mercado Pago. Esses pagamentos ficam fora dos pedidos e não ativam matrículas.
    </p>

    <div
      v-if="settingsError || !settings?.configured"
      class="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"
    >
      Configure <code>NUXT_MERCADO_PAGO_TEST_ACCESS_TOKEN</code> e <code>NUXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY</code> no servidor para habilitar o simulador.
    </div>

    <div
      v-else
      class="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div class="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-7">
        <div
          class="grid grid-cols-2 gap-3"
          role="group"
          aria-label="Forma de pagamento para teste"
        >
          <button
            type="button"
            class="rounded-xl border p-3 font-bold"
            :class="method === 'PIX' ? 'border-primary bg-blue-50 text-primary-800' : 'border-border'"
            @click="method = 'PIX'; payment = null"
          >
            Pix
          </button>
          <button
            type="button"
            class="rounded-xl border p-3 font-bold"
            :class="method === 'CREDIT_CARD' ? 'border-primary bg-blue-50 text-primary-800' : 'border-border'"
            @click="method = 'CREDIT_CARD'; payment = null"
          >
            Cartão de crédito
          </button>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold">Valor de teste (R$)<input
            v-model.number="payer.amount"
            type="number"
            min="1"
            max="10000"
            step="0.01"
            class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
          ></label>
          <label class="text-sm font-semibold">Nome do pagador<input
            v-model="payer.full_name"
            autocomplete="name"
            class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
          ></label>
          <label class="text-sm font-semibold">E-mail da conta compradora de teste<input
            v-model="payer.email"
            type="email"
            autocomplete="email"
            class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
          ></label>
          <label class="text-sm font-semibold">CPF<input
            v-model="payer.cpf"
            inputmode="numeric"
            autocomplete="off"
            maxlength="14"
            class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
          ></label>
        </div>

        <div
          class="mt-6"
          :class="{ 'pointer-events-none opacity-60': loading }"
        >
          <button
            v-if="method === 'PIX'"
            type="button"
            class="w-full rounded-xl bg-primary-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            :disabled="loading || !payer.full_name || !payer.email || !payer.cpf"
            @click="createPixTest"
          >
            {{ loading ? 'CRIANDO PIX…' : 'GERAR PIX DE TESTE' }}
          </button>
          <MercadoPagoCardForm
            v-else-if="payer.full_name && payer.email && payer.cpf.replace(/\D/g, '').length === 11 && payer.amount >= 1"
            :key="`${payer.email}:${payer.cpf}:${payer.amount}`"
            :public-key="settings.publicKey"
            :amount="payer.amount"
            :email="payer.email"
            :cpf="payer.cpf.replace(/\D/g, '')"
            button-label="TESTAR CARTÃO"
            @payment="createCardTest"
            @error="errorMessage = $event"
          />
          <p
            v-else
            class="rounded-xl bg-slate-50 p-4 text-sm text-muted"
          >
            Preencha nome, e-mail, CPF e valor para carregar o formulário seguro do cartão.
          </p>
        </div>

        <p
          v-if="message"
          role="status"
          class="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800"
        >
          {{ message }}
        </p>
        <p
          v-if="errorMessage"
          role="alert"
          class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>

        <div
          v-if="payment"
          class="mt-5 rounded-xl border border-border bg-slate-50 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-bold">
                Status: {{ payment.status }}<span v-if="payment.status_detail"> · {{ payment.status_detail }}</span>
              </p><p class="mt-1 text-xs text-muted">
                ID {{ payment.payment_id }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold"
              :disabled="loading"
              @click="refreshStatus"
            >
              Atualizar status
            </button>
          </div>
          <template v-if="payment.encoded_image && payment.payload">
            <img
              :src="`data:image/png;base64,${payment.encoded_image}`"
              alt="QR Code Pix de teste"
              class="mx-auto mt-5 size-56"
            >
            <textarea
              :value="payment.payload"
              readonly
              aria-label="Pix Copia e Cola de teste"
              class="mt-4 h-24 w-full rounded-xl border border-border bg-white p-3 text-xs"
            />
            <button
              type="button"
              class="mt-3 w-full rounded-xl border border-border bg-white px-4 py-3 font-bold"
              @click="copyPix"
            >
              Copiar código Pix
            </button>
          </template>
          <a
            v-if="payment.ticket_url"
            :href="payment.ticket_url"
            target="_blank"
            rel="noreferrer"
            class="mt-3 block text-center font-bold text-primary-700"
          >Abrir pagamento de teste no Mercado Pago</a>
        </div>
      </div>

      <aside class="h-fit rounded-2xl border border-border bg-white p-5 text-sm">
        <h2 class="font-black">
          Como usar
        </h2>
        <ol class="mt-3 list-inside list-decimal space-y-2 text-muted">
          <li>Use um comprador de teste criado no painel de desenvolvedores do Mercado Pago.</li>
          <li>Para cartão, informe os dados de cartão de teste fornecidos pelo Mercado Pago.</li>
          <li>Para Pix, gere o QR Code e consulte a situação após simular o pagamento no sandbox.</li>
        </ol>
        <p class="mt-4 rounded-lg bg-blue-50 p-3 text-blue-900">
          Valor do teste: {{ currency(Number(payer.amount) || 0) }}.
        </p>
      </aside>
    </div>
  </section>
</template>
