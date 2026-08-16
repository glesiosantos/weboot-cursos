<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
const route = useRoute(); const config = useRuntimeConfig()
type CredentialEvent = { id: string, profiles: { name: string } | null, courses: { title: string, course_presential_details: { location_name: string, starts_at: string } | null } | null, event_credentials: { code: string, status: string }[] }
const { data: events } = await useFetch<CredentialEvent[]>('/api/student/events')
const item = computed(() => events.value?.find(event => event.id === route.params.enrollmentId))
if (events.value && !item.value) { throw createError({ statusCode: 404, statusMessage: 'Credencial não encontrada' }) }
const code = computed(() => item.value?.event_credentials?.[0]?.code ?? '')
const qr = ref('')
onMounted(async () => { if (code.value) { qr.value = await QRCode.toDataURL(`${config.public.appUrl}/checkin/${code.value}`, { width: 320, margin: 2 }) } })
</script>

<template>
  <section
    v-if="item"
    class="mx-auto max-w-xl rounded-card border border-border bg-white p-7 text-center"
  >
    <AppBadge>{{ item.event_credentials?.[0]?.status === 'ACTIVE' ? 'VÁLIDA' : item.event_credentials?.[0]?.status }}</AppBadge><h1 class="mt-4 text-2xl font-black">
      {{ item.courses?.title }}
    </h1><p class="mt-2 font-semibold">
      {{ item.profiles?.name }}
    </p><p class="mt-2 text-muted">
      {{ item.courses?.course_presential_details?.location_name }} · {{ item.courses?.course_presential_details?.starts_at ? formatCourseDate(item.courses.course_presential_details.starts_at) : 'Data a confirmar' }}
    </p><img
      v-if="qr"
      :src="qr"
      alt="QR Code da credencial"
      class="mx-auto mt-6 size-72"
    ><p class="mt-4 text-sm text-muted">
      Código alternativo
    </p><code class="mt-2 block break-all font-bold">{{ code }}</code><AppButton
      :to="`/api/student/events/${route.params.enrollmentId}/credential.pdf`"
      variant="secondary"
      class="mt-6"
    >
      BAIXAR COMPROVANTE
    </AppButton>
  </section>
</template>
