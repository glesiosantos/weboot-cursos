<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Editar curso | Administração', robots: 'noindex' })
const route = useRoute(); const id = String(route.params.id)
const { data: course, error, refresh: refreshCourse } = await useFetch(`/api/admin/courses/${id}`)
if (error.value || !course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
type CourseSummary = { summary: { enrolled: number, paid: number, pending: number, revenue: number, credentials: number, checkedIn: number, batchSales: Record<string, number> } }
const { data: enrollmentDashboard, refresh: refreshDashboard } = await useFetch<CourseSummary>(`/api/admin/courses/${id}/participants`)
const details = Array.isArray(course.value.course_presential_details) ? course.value.course_presential_details[0] : course.value.course_presential_details
const initial = { ...course.value, batches: (course.value.course_batches ?? []).map(batch => ({ ...batch, starts_at: batch.starts_at?.slice(0, 16) ?? null, ends_at: batch.ends_at?.slice(0, 16) ?? null })), presential: details ? { ...details, starts_at: details.starts_at.slice(0, 16), ends_at: details.ends_at.slice(0, 16), registration_deadline: details.registration_deadline?.slice(0, 16) ?? null } : null }
const now = Date.now()
const currentBatch = computed(() => (course.value?.course_batches ?? []).find(batch => batch.status === 'ACTIVE')
  ?? (course.value?.course_batches ?? []).find(batch => batch.status === 'SCHEDULED' && (!batch.starts_at || new Date(batch.starts_at).getTime() <= now) && (!batch.ends_at || new Date(batch.ends_at).getTime() > now)))
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const materialTitle = ref('')
const materialFile = ref<File | null>(null)
const materialInputKey = ref(0)
const materialBusy = ref(false)
const materialMessage = ref('')
const uploadMaterial = async () => {
  if (!materialTitle.value.trim() || !materialFile.value) { return }
  materialBusy.value = true; materialMessage.value = ''
  const body = new FormData(); body.append('title', materialTitle.value); body.append('file', materialFile.value)
  try { await $fetch(`/api/admin/courses/${id}/materials`, { method: 'POST', body }); materialTitle.value = ''; materialFile.value = null; materialInputKey.value += 1; materialMessage.value = 'Material anexado com sucesso.'; await refreshCourse() }
  catch { materialMessage.value = 'Não foi possível anexar o material.' }
  finally { materialBusy.value = false }
}
const removeMaterial = async (materialId: string) => {
  if (!confirm('Remover este material do curso?')) { return }
  await $fetch(`/api/admin/courses/${id}/materials/${materialId}`, { method: 'DELETE' }); await refreshCourse()
}
const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <AppBadge>PERFIL DO CURSO</AppBadge><h1 class="mt-3 text-3xl font-black">
          {{ course?.title }}
        </h1><p class="mt-2 text-muted">
          Acompanhe a turma e gerencie todo o curso em um só lugar.
        </p>
      </div><div class="flex flex-wrap gap-2">
        <AdminIconAction
          label="Visualizar curso"
          icon="eye"
          :to="`/cursos/${course?.slug}`"
        /><AdminIconAction
          label="Preview administrativo"
          icon="eye"
          :to="`/admin/cursos/${id}/preview`"
        /><AdminIconAction
          label="Alunos matriculados"
          icon="users"
          :to="`/admin/cursos/${id}/inscritos`"
        /><AdminIconAction
          label="Notificar alunos"
          icon="bell"
          :to="`/admin/cursos/${id}/inscritos`"
        /><AdminIconAction
          v-if="course?.course_type === 'ONLINE'"
          label="Conteúdo e materiais"
          icon="materials"
          :to="`/admin/cursos/${id}/conteudo`"
        /><AdminIconAction
          v-if="course?.course_type === 'PRESENCIAL'"
          label="Check-in"
          icon="checkin"
          :to="`/admin/cursos/${id}/checkin`"
        />
      </div>
    </div>
    <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-card border border-border bg-white p-5">
        <p class="text-sm font-bold text-muted">
          Inscrições ativas
        </p><p class="mt-2 text-2xl font-black">
          {{ enrollmentDashboard?.summary.enrolled ?? 0 }}
        </p>
      </article><article class="rounded-card border border-border bg-white p-5">
        <p class="text-sm font-bold text-muted">
          Vendas confirmadas
        </p><p class="mt-2 text-2xl font-black">
          {{ enrollmentDashboard?.summary.paid ?? 0 }}
        </p>
      </article><article class="rounded-card border border-border bg-white p-5">
        <p class="text-sm font-bold text-muted">
          Receita do curso
        </p><p class="mt-2 text-2xl font-black">
          {{ money(enrollmentDashboard?.summary.revenue ?? 0) }}
        </p>
      </article><article class="rounded-card border border-border bg-white p-5">
        <p class="text-sm font-bold text-muted">
          Aguardando pagamento
        </p><p class="mt-2 text-2xl font-black">
          {{ enrollmentDashboard?.summary.pending ?? 0 }}
        </p>
      </article>
    </div>
    <section class="mt-6 rounded-card border border-border bg-white p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary-600">
            Lote em venda
          </p><h2 class="mt-2 text-xl font-black">
            {{ course?.pricing_type === 'BATCHES' ? (currentBatch?.name ?? 'Nenhum lote ativo') : 'Preço fixo' }}
          </h2>
        </div><div class="text-right">
          <p class="text-2xl font-black text-primary-700">
            {{ money(Number(currentBatch?.price ?? course?.promotional_price ?? course?.price ?? 0)) }}
          </p><p
            v-if="currentBatch"
            class="text-sm text-muted"
          >
            {{ enrollmentDashboard?.summary.batchSales[currentBatch.id] ?? 0 }} venda(s)<span v-if="currentBatch.max_sales"> de {{ currentBatch.max_sales }}</span>
          </p>
        </div>
      </div>
    </section>
    <section class="mt-6 rounded-card border border-border bg-white p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black">
            Materiais e apostilas
          </h2><p class="mt-1 text-sm text-muted">
            Anexe arquivos que ficarão disponíveis para alunos matriculados.
          </p>
        </div><AdminIconAction
          v-if="course?.course_type === 'ONLINE'"
          label="Ver organização de conteúdo"
          icon="materials"
          :to="`/admin/cursos/${id}/conteudo`"
        />
      </div>
      <form
        class="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
        @submit.prevent="uploadMaterial"
      >
        <label
          class="sr-only"
          for="profile-material-title"
        >Título do material</label><input
          id="profile-material-title"
          v-model="materialTitle"
          required
          class="field !mt-0"
          placeholder="Ex.: Apostila principal"
        ><label
          class="sr-only"
          for="profile-material-file"
        >Arquivo</label><input
          id="profile-material-file"
          :key="materialInputKey"
          type="file"
          required
          accept=".pdf,.docx,.pptx,.xlsx,.zip"
          class="field !mt-0"
          @change="materialFile = ($event.target as HTMLInputElement).files?.[0] ?? null"
        ><AppButton
          type="submit"
          :disabled="materialBusy"
        >
          {{ materialBusy ? 'Enviando…' : 'Anexar' }}
        </AppButton>
      </form><p
        v-if="materialMessage"
        class="mt-3 text-sm font-bold text-primary-700"
      >
        {{ materialMessage }}
      </p>
      <div
        v-if="course?.course_materials.length"
        class="mt-5 grid gap-3 md:grid-cols-2"
      >
        <article
          v-for="material in course.course_materials"
          :key="material.id"
          class="flex items-center justify-between gap-4 rounded-xl bg-canvas p-4"
        >
          <div>
            <p class="font-bold">
              {{ material.title }}
            </p><p class="text-xs text-muted">
              {{ fileSize(material.file_size) }}
            </p>
          </div><button
            type="button"
            class="text-sm font-bold text-danger"
            @click="removeMaterial(material.id)"
          >
            Remover
          </button>
        </article>
      </div><p
        v-else
        class="mt-5 text-sm text-muted"
      >
        Nenhum material anexado.
      </p>
    </section>
    <div class="mt-6 flex justify-end">
      <button
        class="text-sm font-bold text-primary-700"
        @click="refreshDashboard()"
      >
        Atualizar indicadores
      </button>
    </div>
    <div class="mt-8 border-t border-border pt-8">
      <AppBadge>CONFIGURAÇÕES</AppBadge><h2 class="mt-3 text-2xl font-black">
        Editar informações do curso
      </h2>
    </div><AdminCourseForm
      :course-id="id"
      :initial="initial"
    />
  </section>
</template>
