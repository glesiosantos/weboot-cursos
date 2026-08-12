<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute(); const courseId = String(route.params.id)
type Participant = { id: string, email: string, status: string, profiles: { name: string } | null, orders: { status: string } | null, event_credentials: { code: string, status: string }[], attendance: { status: string }[] }
const { data: participants, refresh } = await useFetch<Participant[]>(`/api/admin/courses/${courseId}/participants`)
const search = ref('')
const filtered = computed(() => (participants.value ?? []).filter((item) => {
  const term = search.value.toLowerCase()
  return `${item.profiles?.name ?? ''} ${item.email} ${item.event_credentials?.[0]?.code ?? ''}`.toLowerCase().includes(term)
}))
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <AppBadge>PARTICIPANTES</AppBadge><h1 class="mt-4 text-3xl font-black">
          Inscritos
        </h1>
      </div><div class="flex gap-3">
        <AppButton :to="`/admin/cursos/${courseId}/checkin`">
          Check-in
        </AppButton><AppButton
          :to="`/api/admin/courses/${courseId}/participants?format=csv`"
          external
          variant="secondary"
        >
          Exportar CSV
        </AppButton>
      </div>
    </div><input
      v-model="search"
      class="mt-7 w-full rounded-xl border border-border p-3"
      placeholder="Buscar por nome, email ou código"
    ><div class="mt-5 overflow-x-auto rounded-card border border-border bg-white">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-border">
            <th class="p-4">
              Aluno
            </th><th>Email</th><th>Pagamento</th><th>Matrícula</th><th>Credencial</th><th>Check-in</th><th>Ação</th>
          </tr>
        </thead><tbody>
          <tr
            v-for="item in filtered"
            :key="item.id"
            class="border-b border-border/60"
          >
            <td class="p-4 font-semibold">
              {{ item.profiles?.name }}
            </td><td>{{ item.email }}</td><td>{{ item.orders?.status }}</td><td>{{ item.status }}</td><td>{{ item.event_credentials?.[0]?.status ?? '—' }}</td><td>{{ item.attendance?.[0]?.status ?? '—' }}</td><td>
              <AppButton
                v-if="item.event_credentials?.[0]?.status === 'ACTIVE'"
                :to="`/admin/cursos/${courseId}/checkin?codigo=${encodeURIComponent(item.event_credentials[0].code)}`"
                variant="secondary"
              >
                Marcar entrada
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div><button
      class="mt-4 text-sm font-bold text-primary-700"
      @click="() => refresh()"
    >
      Atualizar lista
    </button>
  </section>
</template>
