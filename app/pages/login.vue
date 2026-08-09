<script setup lang="ts">
import type { Database } from '~/types/database.types'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const { signIn } = useAuth()
const client = useSupabaseClient<Database>()
const authFeedback = useState<string | undefined>('auth-feedback')

onBeforeUnmount(() => {
  authFeedback.value = undefined
})

const submit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    const { data: authData, error } = await signIn({ email: email.value, password: password.value })
    if (error) {
      throw error
    }

    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    await navigateTo(getAuthenticatedHome(profile?.role))
  }
  catch {
    errorMessage.value = 'Não foi possível entrar. Confira suas credenciais.'
  }
  finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Entrar | Weboot Cursos', robots: 'noindex, nofollow' })
</script>

<template>
  <section class="page-shell grid min-h-[calc(100vh-18rem)] items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
    <div class="hidden rounded-[1.75rem] bg-ink p-10 text-white lg:block">
      <AppBadge>ÁREA DO ALUNO</AppBadge><h2 class="mt-8 text-4xl font-black tracking-tight">
        Continue de onde parou.
      </h2><p class="mt-4 max-w-md leading-7 text-primary-100">
        Seus cursos, materiais, progresso e certificados reunidos em uma experiência simples.
      </p><div class="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p class="text-sm font-bold">
          Aprendizado organizado
        </p><div class="mt-5 h-2 rounded-full bg-white/10">
          <div class="h-full w-2/3 rounded-full bg-accent-400" />
        </div>
      </div>
    </div>
    <div class="mx-auto w-full max-w-md">
      <AppBadge>BOAS-VINDAS</AppBadge><h1 class="mt-5 text-4xl font-black tracking-tight">
        Entrar na plataforma
      </h1><p class="mt-3 text-muted">
        Use seus dados para acessar sua conta.
      </p>
      <form
        class="mt-8 space-y-5 rounded-card border border-border bg-white p-6 sm:p-8"
        @submit.prevent="submit"
      >
        <p
          v-if="authFeedback"
          role="status"
          class="rounded-lg bg-primary-50 p-3 text-sm font-semibold text-primary-700"
        >
          {{ authFeedback }}
        </p>
        <div>
          <label
            for="email"
            class="mb-2 block font-medium"
          >Email</label><input
            id="email"
            v-model="email"
            class="w-full rounded-xl border border-border bg-canvas px-4 py-3 outline-none focus:border-primary-500"
            type="email"
            autocomplete="email"
            required
          >
        </div>
        <div>
          <label
            for="password"
            class="mb-2 block font-medium"
          >Senha</label><input
            id="password"
            v-model="password"
            class="w-full rounded-xl border border-border bg-canvas px-4 py-3 outline-none focus:border-primary-500"
            type="password"
            autocomplete="current-password"
            minlength="8"
            required
          >
        </div>
        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-lg bg-red-50 p-3 text-sm text-danger"
        >
          {{ errorMessage }}
        </p>
        <AppButton
          type="submit"
          class="w-full"
          :disabled="loading"
        >
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </AppButton>
        <NuxtLink
          to="/esqueci-minha-senha"
          class="block text-center text-sm font-semibold text-primary-700"
        >Esqueci minha senha</NuxtLink>
      </form>
      <p class="mt-6 text-center text-sm text-muted">
        Ainda não possui conta? <NuxtLink
          to="/cadastro"
          class="font-bold text-primary-700"
        >Criar conta</NuxtLink>
      </p>
    </div>
  </section>
</template>
