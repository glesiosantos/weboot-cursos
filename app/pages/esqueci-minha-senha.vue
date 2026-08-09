<script setup lang="ts">
const email = ref('')
const message = ref('')
const loading = ref(false)
const { resetPassword } = useAuth()

const submit = async () => {
  loading.value = true
  try {
    await resetPassword(email.value)
  }
  finally {
    message.value = 'Se existir uma conta para esse endereço, você receberá as instruções para redefinir sua senha.'
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-16">
    <h1 class="text-3xl font-bold">
      Esqueci minha senha
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
      <p
        v-if="message"
        role="status"
        class="text-sm text-brand-700"
      >
        {{ message }}
      </p>
      <button
        class="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? 'Enviando…' : 'Enviar link de recuperação' }}
      </button>
    </form>
  </section>
</template>
