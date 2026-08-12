<script setup lang="ts">
const client = useSupabaseClient()
const status = ref<'processing' | 'ready' | 'invalid'>('invalid')
let recoveryEventReceived = false

const clearAuthFragment = () => {
  if (window.location.hash) {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
  }
}

const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryEventReceived = true
    status.value = session ? 'ready' : 'invalid'
  }
})

onMounted(async () => {
  const hasRecoveryPayload = Boolean(window.location.hash || new URLSearchParams(window.location.search).get('code'))
  if (!hasRecoveryPayload) {
    return
  }
  status.value = 'processing'
  const { data, error } = await client.auth.getSession()

  // PASSWORD_RECOVERY is queued by the SDK after it has consumed the URL.
  window.setTimeout(() => {
    if (status.value === 'processing') {
      status.value = !error && data.session && recoveryEventReceived ? 'ready' : 'invalid'
    }
    clearAuthFragment()
  }, 0)
})

onBeforeUnmount(() => authListener.subscription.unsubscribe())

useSeoMeta({ title: 'Redefinir senha | WeBoot Cursos', robots: 'noindex, nofollow' })
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16">
    <h1 class="text-3xl font-bold">
      Redefinir sua senha
    </h1>
    <p class="mt-3 text-muted">
      Informe sua nova senha para recuperar o acesso à sua conta.
    </p>

    <p
      v-if="status === 'processing'"
      role="status"
      class="mt-8 rounded-xl bg-primary-50 p-4 text-primary-700"
    >
      Validando seu link de recuperação…
    </p>

    <AccountChangePasswordForm
      v-else-if="status === 'ready'"
      class="mt-8"
      recovery
    />

    <div
      v-else
      role="alert"
      class="mt-8 rounded-xl bg-red-50 p-5 text-danger"
    >
      <p class="font-bold">
        Este link de recuperação expirou ou não é mais válido.
      </p>
      <NuxtLink
        to="/esqueci-minha-senha"
        class="mt-4 inline-flex font-bold text-primary-700"
      >Solicitar novo link</NuxtLink>
    </div>
  </section>
</template>
