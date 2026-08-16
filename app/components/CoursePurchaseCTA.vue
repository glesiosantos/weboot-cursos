<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ courseId: string, courseSlug: string }>()
const user = useSupabaseUser()
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
const target = computed(() => {
  if (context.value?.role === 'ADMIN') { return `/admin/cursos/${props.courseId}` }
  if (context.value?.enrolled) { return '/aluno/cursos' }
  return `/cursos/${encodeURIComponent(props.courseSlug)}/inscricao`
})
</script>

<template>
  <AppButton
    :to="target"
    class="w-full"
  >
    {{ label }}
  </AppButton>
</template>
