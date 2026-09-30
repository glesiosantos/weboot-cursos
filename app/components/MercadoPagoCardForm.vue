<script setup lang="ts">
const props = defineProps<{ publicKey: string, amount: number, email: string, cpf: string, buttonLabel?: string }>()
const emit = defineEmits<{ payment: [data: { token: string, payment_method_id: string, issuer_id?: string, installments: number }], error: [message: string] }>()

type CardFormData = { token?: string, paymentMethodId?: string, issuerId?: string | number, installments?: string | number }
type CardFormInstance = { unmount?: () => void }
type MercadoPagoInstance = { cardForm: (options: Record<string, unknown>) => CardFormInstance }
type MercadoPagoConstructor = new (key: string, options?: Record<string, unknown>) => MercadoPagoInstance
let cardForm: CardFormInstance | undefined
const mounting = ref(true)

const loadSdk = async () => {
  if (window.MercadoPago) { return }
  await new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-mercado-pago-sdk]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.dataset.mercadoPagoSdk = 'true'
      document.head.append(script)
    }
    if (window.MercadoPago) { resolve(); return }
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Não foi possível carregar o Mercado Pago.')), { once: true })
  })
}

onMounted(async () => {
  try {
    if (!props.publicKey) { throw new Error('Chave pública do Mercado Pago não configurada.') }
    await loadSdk()
    const MercadoPago = window.MercadoPago as MercadoPagoConstructor | undefined
    if (!MercadoPago) { throw new Error('SDK do Mercado Pago indisponível.') }
    const mp = new MercadoPago(props.publicKey, { locale: 'pt-BR' })
    cardForm = mp.cardForm({
      amount: String(props.amount),
      maxInstallments: 6,
      iframe: true,
      form: {
        id: 'mercado-pago-card-form',
        cardNumber: { id: 'mp-card-number', placeholder: 'Número do cartão' },
        expirationDate: { id: 'mp-card-expiry', placeholder: 'MM/AA' },
        securityCode: { id: 'mp-card-security', placeholder: 'CVV' },
        cardholderName: { id: 'mp-card-holder', placeholder: 'Nome como aparece no cartão' },
        issuer: { id: 'mp-card-issuer', placeholder: 'Banco emissor' },
        installments: { id: 'mp-card-installments', placeholder: 'Parcelas' },
        identificationType: { id: 'mp-card-document-type', placeholder: 'Documento' },
        identificationNumber: { id: 'mp-card-document-number', placeholder: 'CPF' },
        cardholderEmail: { id: 'mp-card-email', placeholder: 'E-mail' },
      },
      callbacks: {
        onFormMounted: (error: Error | null) => {
          mounting.value = false
          if (error) { emit('error', 'Não foi possível preparar o formulário de cartão.') }
        },
        onSubmit: (event: Event) => {
          event.preventDefault()
          const data = (cardForm as CardFormInstance & { getCardFormData: () => CardFormData }).getCardFormData()
          if (!data.token || !data.paymentMethodId || !data.installments) {
            emit('error', 'Revise os dados do cartão e tente novamente.')
            return
          }
          emit('payment', {
            token: data.token, payment_method_id: data.paymentMethodId,
            issuer_id: data.issuerId === undefined ? undefined : String(data.issuerId), installments: Number(data.installments),
          })
        },
      },
    })
  }
  catch (error) {
    mounting.value = false
    emit('error', error instanceof Error ? error.message : 'Não foi possível carregar o formulário de cartão.')
  }
})

onBeforeUnmount(() => cardForm?.unmount?.())
</script>

<template>
  <form
    id="mercado-pago-card-form"
    class="space-y-4"
    @submit.prevent
  >
    <input
      id="mp-card-amount"
      name="amount"
      type="hidden"
      :value="amount"
    >
    <label class="block text-sm font-semibold">Número do cartão<div
      id="mp-card-number"
      class="mt-1 min-h-11 rounded-xl border border-border px-3 py-3"
    /></label>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block text-sm font-semibold">Validade<div
        id="mp-card-expiry"
        class="mt-1 min-h-11 rounded-xl border border-border px-3 py-3"
      /></label>
      <label class="block text-sm font-semibold">Código de segurança<div
        id="mp-card-security"
        class="mt-1 min-h-11 rounded-xl border border-border px-3 py-3"
      /></label>
    </div>
    <label class="block text-sm font-semibold">Nome no cartão<div
      id="mp-card-holder"
      class="mt-1 min-h-11 rounded-xl border border-border px-3 py-3"
    /></label>
    <label class="block text-sm font-semibold">Banco emissor<select
      id="mp-card-issuer"
      class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
    /></label>
    <label class="block text-sm font-semibold">Parcelas<select
      id="mp-card-installments"
      class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
    /></label>
    <label class="block text-sm font-semibold">Tipo de documento<select
      id="mp-card-document-type"
      class="mt-1 min-h-11 w-full rounded-xl border border-border px-3"
    ><option value="CPF">CPF</option></select></label>
    <label class="block text-sm font-semibold">CPF<input
      id="mp-card-document-number"
      :value="cpf"
      readonly
      class="mt-1 min-h-11 w-full rounded-xl border border-border bg-slate-50 px-3"
    ></label>
    <label class="block text-sm font-semibold">E-mail<input
      id="mp-card-email"
      :value="email"
      readonly
      class="mt-1 min-h-11 w-full rounded-xl border border-border bg-slate-50 px-3"
    ></label>
    <button
      type="submit"
      class="w-full rounded-xl bg-primary-700 px-5 py-3 font-bold text-white disabled:opacity-60"
      :disabled="mounting"
    >
      {{ mounting ? 'CARREGANDO CARTÃO…' : buttonLabel || 'PAGAR COM CARTÃO' }}
    </button>
  </form>
</template>

<script lang="ts">
declare global {
  interface Window { MercadoPago?: unknown }
}
</script>
