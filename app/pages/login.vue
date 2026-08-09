<script setup lang="ts">
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const { signIn } = useAuth()

const submit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    const { error } = await signIn({ email: email.value, password: password.value })
    if (error) {
      throw error
    }
    await navigateTo('/aluno')
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
  <section class="mx-auto max-w-md px-4 py-16">
    <h1 class="text-3xl font-bold">
      Entrar
    </h1>
    <form
      class="mt-8 space-y-5"
      @submit.prevent="submit"
    >
      <div>
        <label
          for="email"
          class="mb-2 block font-medium"
        >Email</label><input
          id="email"
          v-model="email"
          class="w-full rounded-lg border border-slate-300 px-4 py-3"
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
          class="w-full rounded-lg border border-slate-300 px-4 py-3"
          type="password"
          autocomplete="current-password"
          minlength="8"
          required
        >
      </div>
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>
      <button
        class="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
    <div class="mt-6 flex justify-between text-sm">
      <NuxtLink to="/cadastro">Criar conta</NuxtLink><NuxtLink to="/esqueci-minha-senha">Esqueci minha senha</NuxtLink>
    </div>
  </section>
</template>
