<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
const { data: profile, refresh } = await useFetch('/api/student/profile')
const name = ref(''); const phone = ref(''); const saved = ref(false); const error = ref('')
watch(profile, (value) => { name.value = value?.name ?? ''; phone.value = value?.phone ?? '' }, { immediate: true })
const submit = async () => {
  error.value = ''; saved.value = false; try { await $fetch('/api/student/profile', { method: 'PUT', body: { name: name.value, phone: phone.value } }); await refresh(); saved.value = true }
  catch { error.value = 'Confira os dados informados.' }
}
</script>

<template>
  <section class="max-w-2xl">
    <AppBadge>PERFIL</AppBadge><h1 class="mt-4 text-3xl font-black">
      Seus dados
    </h1><p class="mt-2 text-muted">
      Usamos somente os dados necessários para identificação e checkout.
    </p><form
      class="mt-7 space-y-5 rounded-card border border-border bg-white p-6"
      @submit.prevent="submit"
    >
      <label class="block font-semibold">Nome<input
        v-model="name"
        required
        minlength="2"
        class="mt-2 w-full rounded-xl border border-border p-3"
      ></label><label class="block font-semibold">Email<input
        :value="profile?.email"
        disabled
        class="mt-2 w-full rounded-xl border border-border bg-canvas p-3"
      ></label><label class="block font-semibold">Telefone<input
        v-model="phone"
        required
        minlength="10"
        class="mt-2 w-full rounded-xl border border-border p-3"
      ></label><p
        v-if="saved"
        role="status"
        class="text-primary-700"
      >
        Perfil atualizado.
      </p><p
        v-if="error"
        role="alert"
        class="text-danger"
      >
        {{ error }}
      </p><AppButton type="submit">
        Salvar
      </AppButton>
    </form>
  </section>
</template>
