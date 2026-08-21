<script setup lang="ts">
const route = useRoute()
const reference = encodeURIComponent(String(route.params.reference))
type Price = { base: number, providerFee: number, serviceFee: number, total: number, installments: number }
type PixResponse = { encodedImage: string, payload: string, expirationDate?: string }
const { data: checkout, refresh: refreshCheckout } = await useFetch<{ status: string, has_open_pix: boolean, course_title: string, expires_at: string, prices: { pix: Price, card: Price[] } }>(`/api/payments/${reference}`)
if (!checkout.value) { throw createError({ statusCode: 404, statusMessage: 'Pagamento não encontrado' }) }

const method = ref<'PIX' | 'CREDIT_CARD'>('PIX')
const card = reactive({ holder_name: '', number: '', expiry_month: '', expiry_year: '', ccv: '', installments: 1 })
const loading = ref(false)
const errorMessage = ref('')
const pix = ref<{ encodedImage: string, payload: string, expirationDate?: string } | null>(null)
const cardProcessed = ref(false)
const paymentConfirmed = computed(() => checkout.value?.status === 'PAID')
const selectedPrice = computed(() => method.value === 'PIX' ? checkout.value!.prices.pix : checkout.value!.prices.card[card.installments - 1]!)
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pay = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    if (method.value === 'PIX') {
      pix.value = await $fetch<PixResponse>(String(`/api/payments/${reference}/pix`), { method: 'POST' })
    }
    else {
      await $fetch(String(`/api/payments/${reference}/card`), { method: 'POST', body: card })
      cardProcessed.value = true
    }
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } }
    errorMessage.value = fetchError.data?.statusMessage ?? 'Não foi possível processar o pagamento.'
  }
  finally { loading.value = false }
}
const copyPix = async () => { if (pix.value?.payload) { await navigator.clipboard.writeText(pix.value.payload) } }
let paymentStatusTimer: ReturnType<typeof setInterval> | undefined
const refreshPaymentStatus = async () => {
  try {
    await $fetch(`/api/payments/${reference}/sync`, { method: 'POST' })
  }
  catch {
    // O webhook continua sendo a fonte principal; uma consulta pontual pode falhar temporariamente.
  }
  await refreshCheckout()
  if (paymentConfirmed.value && paymentStatusTimer) {
    clearInterval(paymentStatusTimer)
    paymentStatusTimer = undefined
  }
}
onMounted(() => {
  if (checkout.value?.has_open_pix) { void pay() }
  if (!paymentConfirmed.value) {
    paymentStatusTimer = setInterval(() => { void refreshPaymentStatus() }, 5000)
  }
})
onBeforeUnmount(() => { if (paymentStatusTimer) { clearInterval(paymentStatusTimer) } })
</script>

<template>
  <main class="page-shell py-12">
    <section class="mx-auto max-w-2xl rounded-card border border-border bg-white p-6 shadow-soft sm:p-9">
      <div
        v-if="paymentConfirmed"
        class="text-center"
        role="status"
        aria-live="polite"
      >
        <div class="text-5xl text-green-600">
          ✓
        </div>
        <h1 class="mt-4 text-3xl font-black">
          Pagamento realizado com sucesso!
        </h1>
        <p class="mt-4 text-muted">
          Sua inscrição em <strong>{{ checkout?.course_title }}</strong> foi confirmada.
        </p>
        <p class="mt-3 text-muted">
          Você receberá um e-mail com as instruções de primeiro acesso. Por segurança, será necessário criar sua senha antes de acessar o painel do aluno.
        </p>
        <AppButton
          to="/login"
          class="mt-6"
        >
          ACESSAR PAINEL DO ALUNO
        </AppButton>
      </div>

      <template v-else>
        <AppBadge>PAGAMENTO</AppBadge>
        <h1 class="mt-4 text-3xl font-black">
          {{ checkout?.course_title }}
        </h1>
        <p class="mt-2 text-muted">
          Seus dados já estão preenchidos. Escolha somente a forma de pagamento.
        </p>

        <div
          v-if="!checkout?.has_open_pix"
          class="mt-8 grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            class="rounded-xl border p-4 font-bold"
            :class="method === 'PIX' ? 'border-primary bg-blue-50' : 'border-border'"
            @click="method = 'PIX'"
          >
            PIX
          </button>
          <button
            type="button"
            class="rounded-xl border p-4 font-bold"
            :class="method === 'CREDIT_CARD' ? 'border-primary bg-blue-50' : 'border-border'"
            @click="method = 'CREDIT_CARD'"
          >
            CARTÃO
          </button>
        </div>

        <form
          v-if="!pix && !cardProcessed && !checkout?.has_open_pix"
          class="mt-6 space-y-5"
          @submit.prevent="pay"
        >
          <template v-if="method === 'CREDIT_CARD'">
            <label class="block font-bold">Nome impresso no cartão<input
              v-model="card.holder_name"
              required
              autocomplete="cc-name"
              class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            ></label>
            <label class="block font-bold">Número do cartão<input
              v-model="card.number"
              required
              inputmode="numeric"
              autocomplete="cc-number"
              class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            ></label>
            <div class="grid grid-cols-3 gap-3">
              <label class="block font-bold">Mês<input
                v-model="card.expiry_month"
                required
                placeholder="MM"
                inputmode="numeric"
                autocomplete="cc-exp-month"
                class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
              ></label>
              <label class="block font-bold">Ano<input
                v-model="card.expiry_year"
                required
                placeholder="AAAA"
                inputmode="numeric"
                autocomplete="cc-exp-year"
                class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
              ></label>
              <label class="block font-bold">CVV<input
                v-model="card.ccv"
                required
                type="password"
                inputmode="numeric"
                autocomplete="cc-csc"
                class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
              ></label>
            </div>
            <label class="block font-bold">Parcelas
              <select
                v-model="card.installments"
                class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
              >
                <option
                  v-for="price in checkout?.prices.card"
                  :key="price.installments"
                  :value="price.installments"
                >{{ price.installments }}x de {{ currency(price.total / price.installments) }} — total {{ currency(price.total) }}</option>
              </select>
            </label>
          </template>
          <dl class="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div class="flex justify-between text-base font-black">
              <dt>Total</dt><dd>{{ currency(selectedPrice.total) }}</dd>
            </div>
          </dl>
          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-xl bg-red-50 p-4 text-sm text-danger"
          >
            {{ errorMessage }}
          </p>
          <AppButton
            type="submit"
            class="w-full"
            :disabled="loading"
          >
            {{ loading ? 'PROCESSANDO…' : method === 'PIX' ? 'GERAR PIX' : 'PAGAR COM CARTÃO' }}
          </AppButton>
        </form>

        <div
          v-if="checkout?.has_open_pix && !pix"
          class="mt-8 text-center"
        >
          <p
            v-if="loading"
            class="font-bold"
          >
            Carregando Pix em aberto…
          </p>
          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-xl bg-red-50 p-4 text-sm text-danger"
          >
            {{ errorMessage }}
          </p>
        </div>

        <div
          v-if="pix"
          class="mt-8 text-center"
        >
          <img
            :src="`data:image/png;base64,${pix.encodedImage}`"
            alt="QR Code Pix"
            class="mx-auto size-64"
          >
          <p class="mt-4 font-bold">
            Escaneie o QR Code ou use o Pix Copia e Cola.
          </p>
          <textarea
            :value="pix.payload"
            readonly
            class="mt-3 h-24 w-full rounded-xl border border-border p-3 text-xs"
          />
          <AppButton
            class="mt-3 w-full"
            @click="copyPix"
          >
            COPIAR CÓDIGO PIX
          </AppButton>
        </div>
        <div
          v-if="cardProcessed"
          class="mt-8 rounded-xl bg-green-50 p-6 text-center"
        >
          <h2 class="text-xl font-black">
            Pagamento enviado
          </h2><p class="mt-2">
            Aguarde a confirmação da operadora. Sua inscrição será liberada automaticamente.
          </p>
        </div>
      </template>
    </section>
  </main>
</template>
