<script setup lang="ts">
const route = useRoute()
const reference = encodeURIComponent(String(route.params.reference))
type Price = { base: number, providerFee: number, serviceFee: number, total: number, installments: number }
type PixResponse = { encodedImage: string, payload: string, expirationDate?: string }
type Checkout = { status: string, has_open_pix: boolean, course_title: string, expires_at: string, prices: { pix: Price } }
const { data: checkout, refresh: refreshCheckout } = await useFetch<Checkout>(`/api/payments/${reference}`)
if (!checkout.value) { throw createError({ statusCode: 404, statusMessage: 'Pagamento não encontrado' }) }

const loading = ref(false)
const errorMessage = ref('')
const pix = ref<{ encodedImage: string, payload: string, expirationDate?: string } | null>(null)
const paymentConfirmed = computed(() => checkout.value?.status === 'PAID')
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pay = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    pix.value = await $fetch<PixResponse>(String(`/api/payments/${reference}/pix`), { method: 'POST' })
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
        <AppBadge>PAGAMENTO</AppBadge>
        <h1 class="mt-4 text-3xl font-black">
          {{ checkout?.course_title }}
        </h1>
        <p class="mt-2 text-muted">
          Seus dados já estão preenchidos. O pagamento está disponível via Pix.
        </p>

        <div
          v-if="!checkout?.has_open_pix"
          class="mt-8"
        >
          <div class="rounded-xl border border-primary bg-blue-50 p-4 text-center font-bold">
            PIX
          </div>
        </div>

        <form
          v-if="!pix && !checkout?.has_open_pix"
          class="mt-6 space-y-5"
          @submit.prevent="pay"
        >
          <dl class="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div class="flex justify-between text-base font-black">
              <dt>Total</dt><dd>{{ currency(checkout!.prices.pix.total) }}</dd>
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
            {{ loading ? 'PROCESSANDO…' : 'GERAR PIX' }}
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
      </template>
    </section>
  </main>
</template>
