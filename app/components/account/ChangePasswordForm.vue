<script setup lang="ts">
import { getChangePasswordErrors } from '~/utils/password'

const props = withDefaults(defineProps<{
  recovery?: boolean
  initialAccess?: boolean
}>(), {
  recovery: false,
  initialAccess: false,
})

const form = reactive({ newPassword: '', passwordConfirmation: '' })
const nonce = ref('')
const awaitingReauthentication = ref(false)
const errors = ref<ReturnType<typeof getChangePasswordErrors>>({})
const feedback = ref<{ type: 'error' | 'success', title: string, description?: string }>()
const loading = ref(false)
const showNewPassword = ref(false)
const showConfirmation = ref(false)
const { updatePassword, reauthenticate, refreshSession, signOut } = useAuth()
const authFeedback = useState<string | undefined>('auth-feedback')

const passwordIsLongEnough = computed(() => form.newPassword.length >= 6)
const passwordsMatch = computed(() => Boolean(form.passwordConfirmation) && form.newPassword === form.passwordConfirmation)

const submit = async () => {
  feedback.value = undefined
  errors.value = getChangePasswordErrors(form)
  if (Object.keys(errors.value).length > 0) {
    return
  }

  loading.value = true
  try {
    const result = await updatePassword(form.newPassword, nonce.value || undefined)
    if (result.reauthenticationNeeded) {
      const { error } = await reauthenticate()
      if (error) {
        feedback.value = { type: 'error', title: 'Não foi possível enviar o código de confirmação. Tente novamente.' }
        return
      }
      awaitingReauthentication.value = true
      feedback.value = {
        type: 'success',
        title: 'Confirme que é você.',
        description: 'Enviamos um código de 6 dígitos para seu email. Informe-o abaixo para concluir a alteração.',
      }
      return
    }
    if (result.sessionExpired) {
      feedback.value = { type: 'error', title: 'Sua sessão expirou. Entre novamente para continuar.' }
      await navigateTo('/login')
      return
    }
    if (result.error) {
      feedback.value = { type: 'error', title: 'Não foi possível alterar sua senha. Tente novamente.' }
      return
    }

    form.newPassword = ''
    form.passwordConfirmation = ''
    nonce.value = ''
    awaitingReauthentication.value = false
    errors.value = {}
    feedback.value = {
      type: 'success',
      title: props.recovery ? 'Senha redefinida com sucesso.' : 'Senha alterada com sucesso.',
      description: props.recovery
        ? 'Senha alterada. Entre novamente com sua nova senha.'
        : 'Sua nova senha já pode ser utilizada nos próximos acessos.',
    }
    if (props.recovery) {
      if (props.initialAccess) { await $fetch('/api/auth/complete-first-access', { method: 'POST' }) }
      authFeedback.value = 'Senha alterada. Entre novamente com sua nova senha.'
      await signOut()
      await navigateTo('/login')
    }
    else if (props.initialAccess) {
      await $fetch('/api/auth/complete-first-access', { method: 'POST' })
      await refreshSession()
      await navigateTo('/aluno')
    }
  }
  catch {
    feedback.value = { type: 'error', title: 'Não foi possível alterar sua senha. Tente novamente.' }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="space-y-6 rounded-card border border-border bg-white p-5 shadow-soft sm:p-8"
    novalidate
    @submit.prevent="submit"
  >
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-primary-600">
        {{ recovery ? 'Redefinir senha' : 'Alterar senha' }}
      </p>
      <h2 class="mt-2 text-xl font-black">
        Defina uma nova senha
      </h2>
    </div>

    <div>
      <label
        for="new-password"
        class="mb-2 block font-medium"
      >Nova senha</label>
      <div class="relative">
        <input
          id="new-password"
          v-model="form.newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          autocomplete="new-password"
          maxlength="128"
          :aria-invalid="Boolean(errors.newPassword)"
          :aria-describedby="errors.newPassword ? 'new-password-error password-requirements' : 'password-requirements'"
          class="w-full rounded-xl border border-border bg-canvas px-4 py-3 pr-20 outline-none focus:border-primary-500"
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-4 text-sm font-bold text-primary-700"
          :aria-label="showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'"
          @click="showNewPassword = !showNewPassword"
        >
          {{ showNewPassword ? 'Ocultar' : 'Mostrar' }}
        </button>
      </div>
      <p
        v-if="errors.newPassword"
        id="new-password-error"
        class="mt-2 text-sm text-danger"
      >
        {{ errors.newPassword }}
      </p>
    </div>

    <div>
      <label
        for="password-confirmation"
        class="mb-2 block font-medium"
      >Confirmar nova senha</label>
      <div class="relative">
        <input
          id="password-confirmation"
          v-model="form.passwordConfirmation"
          :type="showConfirmation ? 'text' : 'password'"
          autocomplete="new-password"
          maxlength="128"
          :aria-invalid="Boolean(errors.passwordConfirmation)"
          :aria-describedby="errors.passwordConfirmation ? 'password-confirmation-error password-requirements' : 'password-requirements'"
          class="w-full rounded-xl border border-border bg-canvas px-4 py-3 pr-20 outline-none focus:border-primary-500"
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-4 text-sm font-bold text-primary-700"
          :aria-label="showConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'"
          @click="showConfirmation = !showConfirmation"
        >
          {{ showConfirmation ? 'Ocultar' : 'Mostrar' }}
        </button>
      </div>
      <p
        v-if="errors.passwordConfirmation"
        id="password-confirmation-error"
        class="mt-2 text-sm text-danger"
      >
        {{ errors.passwordConfirmation }}
      </p>
    </div>

    <ul
      id="password-requirements"
      class="space-y-2 text-sm"
      aria-label="Requisitos da senha"
    >
      <li :class="passwordIsLongEnough ? 'text-success' : 'text-muted'">
        <span aria-hidden="true">{{ passwordIsLongEnough ? '✓' : '○' }}</span> Pelo menos 6 caracteres
      </li>
      <li :class="passwordsMatch ? 'text-success' : 'text-muted'">
        <span aria-hidden="true">{{ passwordsMatch ? '✓' : '○' }}</span> Senhas coincidem
      </li>
    </ul>

    <div v-if="awaitingReauthentication">
      <label
        for="reauthentication-code"
        class="mb-2 block font-medium"
      >Código de confirmação</label>
      <input
        id="reauthentication-code"
        v-model="nonce"
        class="w-full rounded-xl border border-border bg-canvas px-4 py-3 outline-none focus:border-primary-500"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]{6}"
        maxlength="6"
        required
      >
    </div>

    <div
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        v-if="feedback"
        :role="feedback.type === 'error' ? 'alert' : 'status'"
        class="rounded-xl p-4 text-sm"
        :class="feedback.type === 'success' ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-danger'"
      >
        <p class="font-bold">
          {{ feedback.title }}
        </p>
        <p
          v-if="feedback.description"
          class="mt-1"
        >
          {{ feedback.description }}
        </p>
      </div>
    </div>

    <AppButton
      type="submit"
      class="w-full sm:w-auto"
      :disabled="loading"
    >
      {{ loading ? (recovery ? 'Redefinindo senha…' : 'Alterando senha…') : (recovery ? 'Redefinir senha' : 'Alterar senha') }}
    </AppButton>
  </form>
</template>
