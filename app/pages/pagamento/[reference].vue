<script setup lang="ts">
const route = useRoute()
const reference = encodeURIComponent(String(route.params.reference))
type Price = { base: number, providerFee: number, serviceFee: number, total: number, installments: number }
type PixResponse = { encodedImage: string, payload: string, expirationDate?: string }
type Checkout = { status: string, has_open_pix: boolean, course_title: string, expires_at: string, mercado_pago_public_key: string, payer_email: string, payer_cpf: string, prices: { pix: Price, card: Price[] } }
type PaymentResponse = { payment_id?: string, status?: string, status_detail?: string, paid?: boolean }
const { data: checkout, refresh: refreshCheckout } = await useFetch<Checkout>(`/api/payments/${reference}`)
if (!checkout.value) { throw createError({ statusCode: 404, statusMessage: 'Pagamento não encontrado' }) }

const method = ref<'PIX' | 'CREDIT_CARD'>('PIX')
const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const pix = ref<PixResponse | null>(null)
const cardSubmitted = ref(false)
const paymentConfirmed = computed(() => checkout.value?.status === 'PAID')
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const payPix = async () => {
  loading.value = true
  errorMessage.value = ''
  try { pix.value = await $fetch<PixResponse>(String(`/api/payments/${reference}/pix`), { method: 'POST' }) }
  catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível processar o Pix.'
  }
  finally { loading.value = false }
}

const payCard = async (card: { token: string, payment_method_id: string, issuer_id?: string, installments: number }) => {
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  try {
    const result = await $fetch<PaymentResponse>(`/api/payments/${reference}/card`, { method: 'POST', body: card })
    cardSubmitted.value = true
    infoMessage.value = result.status === 'approved' ? 'Cartão aprovado. Confirmando sua inscrição com segurança…' : `Cartão enviado ao Mercado Pago (${result.status ?? 'em análise'}). A confirmação pode levar alguns instantes.`
    await refreshPaymentStatus()
  }
  catch (error: unknown) {
    errorMessage.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível processar o cartão.'
  }
  finally { loading.value = false }
}

const copyPix = async () => {
  if (pix.value?.payload) { await navigator.clipboard.writeText(pix.value.payload); infoMessage.value = 'Código Pix copiado.' }
}
let paymentStatusTimer: ReturnType<typeof setInterval> | undefined
const refreshPaymentStatus = async () => {
  try { await $fetch(`/api/payments/${reference}/sync`, { method: 'POST' }) }
  catch { /* O webhook é a confirmação principal; a consulta pode falhar temporariamente. */ }
  await refreshCheckout()
  if (paymentConfirmed.value && paymentStatusTimer) {
    clearInterval(paymentStatusTimer)
    paymentStatusTimer = undefined
  }
}
onMounted(() => {
  if (checkout.value?.has_open_pix) { void payPix() }
  if (!paymentConfirmed.value) { paymentStatusTimer = setInterval(() => { void refreshPaymentStatus() }, 5000) }
})
onBeforeUnmount(() => { if (paymentStatusTimer) { clearInterval(paymentStatusTimer) } })
</script>

<template>
  <main class="page-shell py-12">
    <section class="mx-auto max-w-2xl rounded-card border border-border bg-white p-4 shadow-soft sm:p-9">
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
        <AppBadge>PAGAMENTO SEGURO</AppBadge>
        <h1 class="mt-4 text-3xl font-black">
          {{ checkout?.course_title }}
        </h1>
        <p class="mt-2 text-muted">
          Escolha pagar com Pix ou cartão de crédito. A inscrição é confirmada após a validação do Mercado Pago.
        </p>

        <div
          v-if="!checkout?.has_open_pix && !pix && !cardSubmitted"
          class="mt-8 grid grid-cols-2 gap-3"
          role="group"
          aria-label="Forma de pagamento"
        >
          <button
            type="button"
            class="rounded-xl border p-4 font-bold"
            :class="method === 'PIX' ? 'border-primary bg-blue-50' : 'border-border'"
            @click="method = 'PIX'; errorMessage = ''"
          >
            PIX
          </button>
          <button
            type="button"
            class="rounded-xl border p-4 font-bold"
            :class="method === 'CREDIT_CARD' ? 'border-primary bg-blue-50' : 'border-border'"
            @click="method = 'CREDIT_CARD'; errorMessage = ''"
          >
            CARTÃO
          </button>
        </div>

        <div
          v-if="method === 'PIX' && !pix"
          class="mt-6"
        >
          <dl class="rounded-xl bg-slate-50 p-4 text-sm">
            <div class="flex justify-between text-base font-black">
              <dt>Total Pix</dt><dd>{{ currency(checkout!.prices.pix.total) }}</dd>
            </div>
          </dl>
          <button
            v-if="!checkout?.has_open_pix"
            type="button"
            class="mt-5 w-full rounded-xl bg-primary-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            :disabled="loading"
            @click="payPix"
          >
            {{ loading ? 'GERANDO PIX…' : 'GERAR PIX' }}
          </button>
          <p
            v-else
            class="mt-5 text-center font-bold"
          >
            Carregando seu Pix em aberto…
          </p>
        </div>

        <div
          v-if="method === 'CREDIT_CARD' && !cardSubmitted"
          class="mt-6"
        >
          <dl class="mb-5 rounded-xl bg-slate-50 p-4 text-sm">
            <div class="flex justify-between text-base font-black">
              <dt>Total</dt><dd>{{ currency(checkout!.prices.card[0]!.total) }}</dd>
            </div><p class="mt-2 text-xs text-muted">
              As opções de parcelamento disponíveis serão exibidas pelo Mercado Pago.
            </p>
          </dl>
          <MercadoPagoCardForm
            :public-key="checkout!.mercado_pago_public_key"
            :amount="checkout!.prices.card[0]!.total"
            :email="checkout!.payer_email"
            :cpf="checkout!.payer_cpf"
            @payment="payCard"
            @error="errorMessage = $event"
          />
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
            aria-label="Pix Copia e Cola"
            class="mt-3 h-24 w-full rounded-xl border border-border p-3 text-xs"
          />
          <AppButton
            class="mt-3 w-full"
            @click="copyPix"
          >
            COPIAR CÓDIGO PIX
          </AppButton>
        </div>
        <p
          v-if="cardSubmitted && !paymentConfirmed"
          role="status"
          aria-live="polite"
          class="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900"
        >
          {{ infoMessage || 'Aguardando confirmação segura do Mercado Pago…' }}
        </p>
        <p
          v-if="errorMessage"
          role="alert"
          class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>
        <p
          v-if="infoMessage && pix"
          role="status"
          class="mt-4 text-sm text-green-700"
        >
          {{ infoMessage }}
        </p>
      </template>
    </section>
  </main>
</template>
