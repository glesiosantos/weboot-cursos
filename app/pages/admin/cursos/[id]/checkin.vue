<script setup lang="ts">
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'

definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
type CheckinResult = { result: 'AUTHORIZED' | 'ALREADY_USED' | 'INVALID', student_name?: string, course_title?: string, checked_in_at?: string }
const route = useRoute()
const token = ref(typeof route.query.codigo === 'string' ? route.query.codigo : '')
const loading = ref(false)
const scanning = ref(false)
const cameraError = ref('')
const result = ref<CheckinResult | null>(null)
const video = ref<HTMLVideoElement | null>(null)
let controls: IScannerControls | undefined

const validate = async (value: string, manual: boolean) => {
  loading.value = true
  result.value = null
  try { result.value = await $fetch<CheckinResult>(`/api/admin/events/${route.params.id}/checkin`, { method: 'POST', body: { token: value, manual } }) }
  catch { result.value = { result: 'INVALID' } }
  finally { loading.value = false }
}
const submit = () => validate(token.value, true)
const stopScanner = () => { controls?.stop(); controls = undefined; scanning.value = false }
const startScanner = async () => {
  cameraError.value = ''; result.value = null; scanning.value = true
  await nextTick()
  if (!video.value) { return }
  try {
    const reader = new BrowserQRCodeReader()
    controls = await reader.decodeFromVideoDevice(undefined, video.value, (scanResult) => {
      if (!scanResult || loading.value) { return }
      token.value = scanResult.getText()
      stopScanner()
      void validate(token.value, false)
    })
  }
  catch {
    scanning.value = false
    cameraError.value = 'Não foi possível acessar a câmera. Autorize o uso ou informe o código manualmente.'
  }
}
const label = computed(() => result.value?.result === 'AUTHORIZED' ? '✓ Entrada autorizada' : result.value?.result === 'ALREADY_USED' ? '⚠ Credencial já utilizada' : '✕ Credencial inválida')
onBeforeUnmount(stopScanner)
</script>

<template>
  <section class="max-w-3xl">
    <AppBadge>CHECK-IN PRESENCIAL</AppBadge><h1 class="mt-4 text-3xl font-black">
      Validar inscrição
    </h1><p class="mt-2 text-muted">
      Leia o QR Code exibido no celular ou no comprovante impresso do aluno.
    </p>
    <div class="mt-7 grid gap-5 md:grid-cols-2">
      <article class="rounded-card border border-border bg-white p-6">
        <h2 class="text-xl font-black">
          Leitura pela câmera
        </h2><p class="mt-2 text-sm text-muted">
          Aponte a câmera para o QR Code da credencial.
        </p>
        <div
          v-if="scanning"
          class="mt-5 overflow-hidden rounded-xl bg-black"
        >
          <video
            ref="video"
            class="aspect-square w-full object-cover"
            muted
            playsinline
          />
        </div>
        <AppButton
          v-if="!scanning"
          class="mt-5"
          :disabled="loading"
          @click="startScanner"
        >
          <AppIcon
            name="checkin"
            class="mr-2"
          />Abrir câmera
        </AppButton><AppButton
          v-else
          class="mt-4"
          variant="secondary"
          @click="stopScanner"
        >
          Cancelar leitura
        </AppButton>
        <p
          v-if="cameraError"
          role="alert"
          class="mt-4 text-sm text-danger"
        >
          {{ cameraError }}
        </p>
      </article>
      <form
        class="rounded-card border border-border bg-white p-6"
        @submit.prevent="submit"
      >
        <h2 class="text-xl font-black">
          Validação manual
        </h2><p class="mt-2 text-sm text-muted">
          Cole a URL lida ou digite o código abaixo do QR.
        </p><label class="mt-5 block font-semibold">Código ou URL<input
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
      </form>
    </div>
    <article
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
      <AppButton
        class="mt-5"
        variant="secondary"
        @click="result = null; token = ''; startScanner()"
      >
        Validar próximo aluno
      </AppButton>
    </article>
  </section>
</template>
