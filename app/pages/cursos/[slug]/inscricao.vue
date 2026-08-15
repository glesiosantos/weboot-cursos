<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { Course } from '~/types/course'

const route = useRoute()
const user = useSupabaseUser()
const client = useSupabaseClient<Database>()
const { data: course } = await useFetch<Course>(`/api/courses/${encodeURIComponent(String(route.params.slug))}`)
if (!course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
const form = reactive({
  full_name: '', cpf: '', whatsapp: '', email: '', postal_code: '', address: '', address_number: '',
  complement: '', province: '', city: '', city_ibge: '', terms_accepted: false, marketing_accepted: false,
})
if (user.value) {
  const { data: profile } = await client.from('profiles').select('name,phone').eq('id', user.value.sub).maybeSingle()
  form.full_name = profile?.name ?? ''
  form.whatsapp = profile?.phone ?? ''
  form.email = user.value.email ?? ''
}
const loading = ref(false)
const loadingAddress = ref(false)
const errorMessage = ref('')
const lookupPostalCode = async () => {
  const postalCode = form.postal_code.replace(/\D/g, '')
  if (postalCode.length !== 8) { return }
  loadingAddress.value = true
  try {
    const address = await $fetch<{ erro?: boolean, logradouro?: string, bairro?: string, localidade?: string, ibge?: string }>(`https://viacep.com.br/ws/${postalCode}/json/`)
    if (address.erro || !address.ibge) { throw new Error('CEP não encontrado') }
    form.address = address.logradouro ?? form.address
    form.province = address.bairro ?? form.province
    form.city = address.localidade ?? ''
    form.city_ibge = address.ibge
  }
  catch {
    form.city_ibge = ''
    errorMessage.value = 'Não foi possível localizar o CEP informado.'
  }
  finally { loadingAddress.value = false }
}
const submit = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch<{ checkout_url: string }>('/api/registrations', {
      method: 'POST', body: { course_id: course.value!.id, ...form },
    })
    await navigateTo(result.checkout_url, { external: result.checkout_url.startsWith('http') })
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } }
    errorMessage.value = fetchError.data?.statusMessage ?? 'Não foi possível iniciar sua inscrição.'
  }
  finally { loading.value = false }
}
</script>

<template>
  <main class="page-shell py-12">
    <section class="mx-auto max-w-2xl rounded-card border border-border bg-white p-6 shadow-soft sm:p-9">
      <AppBadge>INSCRIÇÃO</AppBadge><h1 class="mt-4 text-3xl font-black">
        {{ course?.title }}
      </h1><p class="mt-2 text-muted">
        Informe seus dados para reservar a vaga. Você não precisa criar uma conta ou senha agora.
      </p>
      <form
        class="mt-8 space-y-5"
        @submit.prevent="submit"
      >
        <label class="block font-bold">Nome completo
          <input
            v-model="form.full_name"
            name="full_name"
            autocomplete="name"
            required
            minlength="6"
            maxlength="150"
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
          >
        </label>
        <label class="block font-bold">CPF
          <input
            v-model="form.cpf"
            name="cpf"
            inputmode="numeric"
            autocomplete="off"
            required
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            placeholder="000.000.000-00"
          >
        </label>
        <label class="block font-bold">WhatsApp
          <input
            v-model="form.whatsapp"
            name="whatsapp"
            type="tel"
            autocomplete="tel"
            required
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            placeholder="(86) 99999-9999"
          >
        </label>
        <label class="block font-bold">Email
          <input
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
          >
        </label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block font-bold">CEP
            <input
              v-model="form.postal_code"
              name="postal_code"
              inputmode="numeric"
              autocomplete="postal-code"
              required
              placeholder="00000-000"
              class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
              @blur="lookupPostalCode"
            >
          </label>
          <label class="block font-bold">Número
            <input
              v-model="form.address_number"
              name="address_number"
              autocomplete="address-line2"
              required
              maxlength="20"
              class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            >
          </label>
        </div>
        <label class="block font-bold">Endereço
          <input
            v-model="form.address"
            name="address"
            autocomplete="address-line1"
            required
            maxlength="255"
            :disabled="loadingAddress"
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
          >
        </label>
        <label class="block font-bold">Complemento <span class="font-normal text-muted">(opcional)</span>
          <input
            v-model="form.complement"
            name="complement"
            autocomplete="address-line3"
            maxlength="255"
            class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
          >
        </label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block font-bold">Bairro
            <input
              v-model="form.province"
              name="province"
              required
              maxlength="100"
              :disabled="loadingAddress"
              class="mt-2 w-full rounded-xl border border-border p-3 font-normal"
            >
          </label>
          <label class="block font-bold">Cidade
            <input
              v-model="form.city"
              name="city"
              required
              readonly
              :placeholder="loadingAddress ? 'Consultando CEP…' : ''"
              class="mt-2 w-full rounded-xl border border-border bg-slate-50 p-3 font-normal"
            >
          </label>
        </div>
        <label class="flex items-start gap-3 text-sm"><input
          v-model="form.terms_accepted"
          type="checkbox"
          required
          class="mt-1"
        > <span>Li e concordo com os Termos de Uso e Política de Privacidade.</span></label>
        <label class="flex items-start gap-3 text-sm"><input
          v-model="form.marketing_accepted"
          type="checkbox"
          class="mt-1"
        > <span>Quero receber novidades e comunicações comerciais. Esta autorização é opcional.</span></label>
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
          {{ loading ? 'PREPARANDO CHECKOUT…' : 'CONTINUAR PARA PAGAMENTO' }}
        </AppButton>
      </form>
    </section>
  </main>
</template>
