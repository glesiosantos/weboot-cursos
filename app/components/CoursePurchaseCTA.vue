<script setup lang="ts">
const user = useSupabaseUser()
const soon = ref(false)
const act = async () => {
  if (!user.value) { return navigateTo('/login') }
  soon.value = true
}
</script>

<template>
  <div>
    <AppButton
      class="w-full"
      @click="act"
    >
      QUERO ME INSCREVER
    </AppButton><p
      v-if="soon"
      role="status"
      class="mt-3 text-center text-sm text-muted"
    >
      Inscrições disponíveis em breve.
    </p>
  </div>
</template>
