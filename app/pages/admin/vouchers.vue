<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Vouchers | Administração', robots: 'noindex' })

type Voucher = { id: string, code: string, value: number, active: boolean, alumni_only: boolean, course_id: string | null, max_uses: number | null, used_count: number, starts_at: string | null, expires_at: string | null }
const { data: vouchers, refresh } = await useFetch<Voucher[]>('/api/admin/vouchers')
const form = reactive({ code: '', value: 10, course_id: '', max_uses: '' })
const busy = ref(false)
const message = ref('')
const submit = async () => {
  busy.value = true; message.value = ''
  try {
    await $fetch('/api/admin/vouchers', { method: 'POST', body: { ...form, course_id: form.course_id || null, max_uses: form.max_uses || null, alumni_only: true } })
    form.code = ''; message.value = 'Voucher criado. Ele vale para alunos com matrícula anterior.'; await refresh()
  }
  catch (error) { message.value = (error as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível criar o voucher.' }
  finally { busy.value = false }
}
const toggle = async (voucher: Voucher) => {
  await $fetch(`/api/admin/vouchers/${voucher.id}`, { method: 'PATCH', body: { active: !voucher.active } }); await refresh()
}
</script>

<template>
  <section class="mx-auto max-w-5xl">
    <AppBadge>DESCONTOS</AppBadge><h1 class="mt-3 text-3xl font-black">
      Vouchers para ex-alunos
    </h1>
    <p class="mt-2 max-w-2xl text-muted">
      Crie códigos percentuais para alunos com matrícula ativa ou concluída em outro curso. O código é validado no servidor antes de iniciar o pagamento.
    </p>
    <form
      class="mt-7 grid gap-4 rounded-card border border-border bg-white p-5 sm:grid-cols-3 sm:p-6"
      @submit.prevent="submit"
    >
      <label class="font-bold">Código<input
        v-model="form.code"
        required
        minlength="3"
        maxlength="40"
        class="field"
        placeholder="EXALUNO20"
      ></label>
      <label class="font-bold">Desconto (%)<input
        v-model.number="form.value"
        required
        type="number"
        min="1"
        max="100"
        class="field"
      ></label>
      <label class="font-bold">Limite de usos (opcional)<input
        v-model="form.max_uses"
        type="number"
        min="1"
        class="field"
        placeholder="Sem limite"
      ></label>
      <p class="text-sm text-muted sm:col-span-3">
        O voucher fica disponível para qualquer curso. Validade e curso específico podem ser ajustados na próxima etapa de gestão.
      </p>
      <p
        v-if="message"
        class="text-sm font-bold text-primary-700 sm:col-span-3"
        role="status"
      >
        {{ message }}
      </p>
      <div class="sm:col-span-3">
        <AppButton
          type="submit"
          :disabled="busy"
        >
          {{ busy ? 'Salvando…' : 'Criar voucher' }}
        </AppButton>
      </div>
    </form>
    <div class="mt-8 overflow-hidden rounded-card border border-border bg-white">
      <div
        v-for="voucher in vouchers ?? []"
        :key="voucher.id"
        class="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 last:border-0 sm:p-5"
      >
        <div>
          <p class="font-black">
            {{ voucher.code }} <span class="text-primary-700">· {{ Number(voucher.value) }}% OFF</span>
          </p><p class="mt-1 text-sm text-muted">
            Ex-alunos · {{ voucher.used_count }} uso(s){{ voucher.max_uses ? ` de ${voucher.max_uses}` : '' }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-border px-4 py-2 text-sm font-bold"
          @click="toggle(voucher)"
        >
          {{ voucher.active ? 'Desativar' : 'Ativar' }}
        </button>
      </div>
      <p
        v-if="!vouchers?.length"
        class="p-8 text-center text-muted"
      >
        Nenhum voucher cadastrado.
      </p>
    </div>
  </section>
</template>
