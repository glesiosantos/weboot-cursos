<script setup lang="ts">
const client = useSupabaseClient()
const status = ref<'processing' | 'ready' | 'invalid'>('invalid')
const initialAccess = ref(false)
let recoveryEventReceived = false

const clearAuthPayload = () => {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.delete('code')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
}

const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryEventReceived = true
    initialAccess.value = session?.user.app_metadata?.must_change_password === true
    status.value = session ? 'ready' : 'invalid'
  }
})

onMounted(async () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const hasRecoveryPayload = hashParams.get('type') === 'recovery' || Boolean(new URLSearchParams(window.location.search).get('code'))
  const hasAuthError = hashParams.has('error')
  if (!hasRecoveryPayload && !hasAuthError) {
    return
  }
  status.value = 'processing'
  const { data, error } = await client.auth.getSession()

  // O SDK pode consumir o link e criar a sessão antes de este listener ser registrado.
  window.setTimeout(() => {
    if (status.value === 'processing') {
      status.value = !error && data.session && (hasRecoveryPayload || recoveryEventReceived) ? 'ready' : 'invalid'
    }
    clearAuthPayload()
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
      :initial-access="initialAccess"
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
