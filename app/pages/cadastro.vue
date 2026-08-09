<script setup lang="ts">
const form = reactive({ name: '', email: '', password: '' })
const message = ref('')
const isError = ref(false)
const loading = ref(false)
const { signUp } = useAuth()

const submit = async () => {
  loading.value = true
  isError.value = false
  try {
    const { error } = await signUp(form)
    if (error) {
      throw error
    }
    message.value = 'Cadastro realizado. Confira seu email para confirmar a conta.'
  }
  catch {
    isError.value = true
    message.value = 'Não foi possível criar a conta. Revise os dados e tente novamente.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-16">
    <h1 class="text-3xl font-bold">
      Criar conta
    </h1>
    <form
      class="mt-8 space-y-5"
      @submit.prevent="submit"
    >
      <div>
        <label
          for="name"
          class="mb-2 block font-medium"
        >Nome</label><input
          id="name"
          v-model="form.name"
          class="w-full rounded-lg border border-slate-300 px-4 py-3"
          autocomplete="name"
          required
        >
      </div>
      <div>
        <label
          for="email"
          class="mb-2 block font-medium"
        >Email</label><input
          id="email"
          v-model="form.email"
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
          v-model="form.password"
          class="w-full rounded-lg border border-slate-300 px-4 py-3"
          type="password"
          autocomplete="new-password"
          minlength="6"
          required
        >
      </div>
      <p
        v-if="message"
        role="status"
        :class="isError ? 'text-red-700' : 'text-brand-700'"
      >
        {{ message }}
      </p>
      <button
        class="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? 'Criando…' : 'Criar conta' }}
      </button>
    </form>
  </section>
</template>
