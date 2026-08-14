<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ courseId: string, courseSlug: string }>()
const user = useSupabaseUser()
const purchaseError = ref('')
const loading = ref(false)
const client = useSupabaseClient<Database>()
const { data: context } = await useAsyncData(`course-cta-${props.courseId}`, async () => {
  if (!user.value) { return { role: null, enrolled: false } }
  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    client.from('profiles').select('role').eq('id', user.value.sub).single(),
    client.from('enrollments').select('id').eq('user_id', user.value.sub).eq('course_id', props.courseId).eq('status', 'ACTIVE').maybeSingle(),
  ])
  return { role: profile?.role ?? null, enrolled: Boolean(enrollment) }
})
const label = computed(() => {
  if (!user.value) { return 'QUERO ME INSCREVER' }
  if (context.value?.role === 'ADMIN') { return 'GERENCIAR CURSO' }
  if (context.value?.enrolled) { return 'ACESSAR CURSO' }
  return 'ADQUIRIR CURSO'
})
const act = async () => {
  if (!user.value) { return }
  if (context.value?.role === 'ADMIN') { return navigateTo(`/admin/cursos/${props.courseId}`) }
  if (context.value?.enrolled) { return navigateTo('/aluno/cursos') }
  loading.value = true
  purchaseError.value = ''
  try {
    const result = await $fetch<{ checkout_url: string }>('/api/checkout', { method: 'POST', body: { course_id: props.courseId } })
    await navigateTo(result.checkout_url, { external: true })
  }
  catch (error: unknown) {
    const fetchError = error as { statusCode?: number, data?: { statusCode?: number, statusMessage?: string } }
    const statusCode = fetchError.statusCode ?? fetchError.data?.statusCode
    if (statusCode === 422) { return navigateTo('/aluno/perfil') }
    purchaseError.value = fetchError.data?.statusMessage ?? 'Não foi possível iniciar a compra. Tente novamente.'
  }
  finally { loading.value = false }
}
</script>

<template>
  <div>
    <AppButton
      :to="!user ? `/cursos/${encodeURIComponent(courseSlug)}/inscricao` : undefined"
      class="w-full"
      @click="user ? act() : undefined"
    >
      {{ loading ? 'ABRINDO CHECKOUT…' : label }}
    </AppButton><p
      v-if="purchaseError"
      role="alert"
      class="mt-3 text-center text-sm text-muted"
    >
      {{ purchaseError }}
    </p>
  </div>
</template>
