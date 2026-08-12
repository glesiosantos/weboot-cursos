<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
type CheckinResult = { result: 'AUTHORIZED' | 'ALREADY_USED' | 'INVALID', student_name?: string, course_title?: string, checked_in_at?: string }
const route = useRoute(); const token = ref(typeof route.query.codigo === 'string' ? route.query.codigo : ''); const loading = ref(false); const result = ref<CheckinResult | null>(null)
const submit = async () => {
  loading.value = true; try { result.value = await $fetch<CheckinResult>(String(`/api/admin/events/${route.params.id}/checkin`), { method: 'POST', body: { token: token.value, manual: true } }) }
  catch { result.value = { result: 'INVALID' } }
  finally { loading.value = false }
}
const label = computed(() => result.value?.result === 'AUTHORIZED' ? '✓ Entrada autorizada' : result.value?.result === 'ALREADY_USED' ? '⚠ Credencial já utilizada' : '✕ Credencial inválida')
</script>

<template>
  <section class="max-w-2xl">
    <AppBadge>CHECK-IN</AppBadge><h1 class="mt-4 text-3xl font-black">
      Validar credencial
    </h1><form
      class="mt-7 rounded-card border border-border bg-white p-6"
      @submit.prevent="submit"
    >
      <label class="font-semibold">Código ou token<input
        v-model="token"
        required
        minlength="16"
        autocomplete="off"
        class="mt-2 w-full rounded-xl border border-border p-3 font-mono uppercase"
      ></label><AppButton
        class="mt-5"
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Validando…' : 'Registrar entrada' }}
      </AppButton>
    </form><article
      v-if="result"
      class="mt-6 rounded-card border p-6"
      :class="result.result === 'AUTHORIZED' ? 'border-green-300 bg-green-50' : result.result === 'ALREADY_USED' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'"
    >
      <h2 class="text-2xl font-black">
        {{ label }}
      </h2><template v-if="result.student_name">
        <p class="mt-4">
          <b>Aluno:</b> {{ result.student_name }}
        </p><p><b>Curso:</b> {{ result.course_title }}</p><p><b>Horário:</b> {{ result.checked_in_at ? new Date(result.checked_in_at).toLocaleString('pt-BR') : '—' }}</p>
      </template>
    </article>
  </section>
</template>
