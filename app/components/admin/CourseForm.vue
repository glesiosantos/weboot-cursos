<script setup lang="ts">
import type { CourseBatchActivationMode, CourseBatchStatus, CoursePricingType, CourseStatus, CourseType } from '~/types/database.types'

interface BatchForm { name: string, position: number, price: number, max_sales: number | null, starts_at: string | null, ends_at: string | null, status: CourseBatchStatus, activation_mode: CourseBatchActivationMode }
interface FormData { title: string, slug: string, short_description: string, description: string, course_type: CourseType, instructor_id: string | null, workload_hours: number, price: number, promotional_price: number | null, pricing_type: CoursePricingType, batches: BatchForm[], status: CourseStatus, program: string | null, requirements: string | null, target_audience: string | null, presential: { location_name: string, city: string, state: string, starts_at: string, ends_at: string, registration_deadline: string | null, max_students: number } | null }
const props = defineProps<{ courseId?: string, initial?: Partial<FormData> }>()
const emit = defineEmits<{ saved: [id: string] }>()
const { data: instructors } = await useAsyncData('admin-instructors', async () => {
  const client = useSupabaseClient()
  const { data, error } = await client.from('instructors').select('id,name,active').order('name')
  if (error) { throw error }
  return data
})
const form = reactive<FormData>({ title: '', slug: '', short_description: '', description: '', course_type: 'ONLINE', instructor_id: null, workload_hours: 1, price: 0, promotional_price: null, pricing_type: 'FIXED', batches: [], status: 'DRAFT', program: null, requirements: null, target_audience: null, presential: null, ...props.initial })
const dirty = ref(false); const saving = ref(false); const message = ref(''); const errorMessage = ref(''); const slugTouched = ref(Boolean(props.initial?.slug))
const cover = ref<File | null>(null)
watch(form, () => { dirty.value = true }, { deep: true })
watch(() => form.title, (value) => { if (!slugTouched.value) { form.slug = normalizeSlug(value) } })
watch(() => form.course_type, (value) => { if (value === 'PRESENCIAL' && !form.presential) { form.presential = { location_name: '', city: '', state: '', starts_at: '', ends_at: '', registration_deadline: null, max_students: 1 } } if (value === 'ONLINE') { form.presential = null } })
const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.value) { event.preventDefault() } }
onMounted(() => window.addEventListener('beforeunload', beforeUnload)); onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => !dirty.value || window.confirm('Você possui alterações não salvas. Deseja sair?'))
const asIso = (value: string | null) => value ? new Date(value).toISOString() : null
const normalizePositions = () => form.batches.forEach((batch, index) => { batch.position = index + 1 })
const addBatch = () => { form.batches.push({ name: `${form.batches.length + 1}º lote`, position: form.batches.length + 1, price: 0, max_sales: null, starts_at: null, ends_at: null, status: 'DRAFT', activation_mode: 'QUANTITY' }) }
const removeBatch = (index: number) => { form.batches.splice(index, 1); normalizePositions() }
const moveBatch = (index: number, offset: number) => { const target = index + offset; if (target < 0 || target >= form.batches.length) { return } const [batch] = form.batches.splice(index, 1); form.batches.splice(target, 0, batch!); normalizePositions() }
const submit = async () => {
  saving.value = true; errorMessage.value = ''; message.value = ''
  try {
    const payload = { ...form, batches: form.pricing_type === 'BATCHES' ? form.batches.map(batch => ({ ...batch, starts_at: asIso(batch.starts_at), ends_at: asIso(batch.ends_at) })) : [], presential: form.presential ? { ...form.presential, starts_at: asIso(form.presential.starts_at), ends_at: asIso(form.presential.ends_at), registration_deadline: asIso(form.presential.registration_deadline) } : null }
    const saved = await $fetch<{ id: string }>(props.courseId ? `/api/admin/courses/${props.courseId}` : '/api/admin/courses', { method: props.courseId ? 'PUT' : 'POST', body: payload })
    dirty.value = false; message.value = 'Curso salvo com sucesso.'; emit('saved', saved.id)
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível salvar o curso.' }
  finally { saving.value = false }
}
const uploadCover = async () => {
  if (!props.courseId || !cover.value) { return }
  const body = new FormData()
  body.append('file', cover.value)
  try { await $fetch(`/api/admin/courses/${props.courseId}/cover`, { method: 'POST', body }); message.value = 'Capa enviada com sucesso.'; cover.value = null }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao enviar a capa.' }
}
</script>

<template>
  <form
    class="mt-8 space-y-6"
    @submit.prevent="submit"
  >
    <section class="rounded-card border border-border bg-white p-6">
      <h2 class="text-xl font-black">
        Informações básicas
      </h2><div class="mt-5 grid gap-5 sm:grid-cols-2">
        <label class="font-bold sm:col-span-2">Título<input
          v-model="form.title"
          required
          maxlength="160"
          class="field"
        ></label><label class="font-bold">Slug<input
          v-model="form.slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          class="field"
          @input="slugTouched = true"
        ></label><label class="font-bold">Modalidade<select
          v-model="form.course_type"
          class="field"
        ><option value="ONLINE">Online</option><option value="PRESENCIAL">Presencial</option></select></label><label class="font-bold sm:col-span-2">Resumo<textarea
          v-model="form.short_description"
          maxlength="280"
          rows="3"
          class="field"
        /></label><label class="font-bold sm:col-span-2">Descrição<textarea
          v-model="form.description"
          rows="7"
          class="field"
        /></label>
      </div>
    </section>
    <section class="rounded-card border border-border bg-white p-6">
      <h2 class="text-xl font-black">
        Instrutor e investimento
      </h2><div class="mt-5 grid gap-5 sm:grid-cols-3">
        <label class="font-bold">Instrutor<select
          v-model="form.instructor_id"
          class="field"
        ><option :value="null">Selecione</option><option
          v-for="instructor in instructors"
          :key="instructor.id"
          :value="instructor.id"
        >{{ instructor.name }}</option></select></label><label class="font-bold">Carga horária<input
          v-model.number="form.workload_hours"
          type="number"
          min="0.01"
          step="0.5"
          required
          class="field"
        ></label><fieldset class="sm:col-span-2">
          <legend class="font-bold">
            Forma de preço
          </legend><div class="mt-3 flex gap-6">
            <label class="flex items-center gap-2"><input
              v-model="form.pricing_type"
              type="radio"
              value="FIXED"
            > Preço único</label><label class="flex items-center gap-2"><input
              v-model="form.pricing_type"
              type="radio"
              value="BATCHES"
            > Venda por lotes</label>
          </div>
        </fieldset><label
          v-if="form.pricing_type === 'FIXED'"
          class="font-bold"
        >Preço<input
          v-model.number="form.price"
          type="number"
          min="0"
          step="0.01"
          required
          class="field"
        ></label><label
          v-if="form.pricing_type === 'FIXED'"
          class="font-bold"
        >Preço promocional<input
          v-model.number="form.promotional_price"
          type="number"
          min="0"
          step="0.01"
          class="field"
        ></label>
      </div>
    </section>
    <section
      v-if="form.pricing_type === 'BATCHES'"
      class="rounded-card border border-border bg-white p-6"
    >
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-black">
          Lotes de venda
        </h2><AppButton
          type="button"
          variant="secondary"
          @click="addBatch"
        >
          + Adicionar lote
        </AppButton>
      </div>
      <p class="mt-2 text-sm text-muted">
        A quantidade vendida será apurada por pagamentos válidos na próxima fase; não há contador manual.
      </p>
      <div class="mt-5 space-y-4">
        <article
          v-for="(batch, index) in form.batches"
          :key="index"
          class="rounded-xl border border-border p-5"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-black">
              {{ batch.name || `${index + 1}º lote` }}
            </h3><div class="flex gap-2">
              <button
                type="button"
                class="rounded border px-3 py-1"
                :disabled="index === 0"
                aria-label="Mover lote para cima"
                @click="moveBatch(index, -1)"
              >
                ↑
              </button><button
                type="button"
                class="rounded border px-3 py-1"
                :disabled="index === form.batches.length - 1"
                aria-label="Mover lote para baixo"
                @click="moveBatch(index, 1)"
              >
                ↓
              </button><button
                type="button"
                class="rounded border border-red-200 px-3 py-1 text-danger"
                @click="removeBatch(index)"
              >
                Remover
              </button>
            </div>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <label class="font-bold">Nome<input
              v-model="batch.name"
              required
              maxlength="120"
              class="field"
            ></label>
            <label class="font-bold">Preço<input
              v-model.number="batch.price"
              required
              type="number"
              min="0"
              step="0.01"
              class="field"
            ></label>
            <label class="font-bold">Avanço<select
              v-model="batch.activation_mode"
              class="field"
            ><option value="QUANTITY">Quantidade</option><option value="DATE">Data</option><option value="QUANTITY_OR_DATE">Quantidade ou data</option></select></label>
            <label
              v-if="batch.activation_mode !== 'DATE'"
              class="font-bold"
            >Limite de vendas<input
              v-model.number="batch.max_sales"
              required
              type="number"
              min="1"
              class="field"
            ></label>
            <label
              v-if="batch.activation_mode !== 'QUANTITY'"
              class="font-bold"
            >Início (opcional)<input
              v-model="batch.starts_at"
              type="datetime-local"
              class="field"
            ></label>
            <label
              v-if="batch.activation_mode !== 'QUANTITY'"
              class="font-bold"
            >Fim (opcional)<input
              v-model="batch.ends_at"
              type="datetime-local"
              class="field"
            ></label>
            <label class="font-bold">Status<select
              v-model="batch.status"
              class="field"
            ><option value="DRAFT">Rascunho</option><option value="SCHEDULED">Agendado</option><option value="ACTIVE">Ativo</option><option value="SOLD_OUT">Esgotado</option><option value="EXPIRED">Expirado</option><option value="DISABLED">Desabilitado</option></select></label>
          </div>
        </article>
        <p
          v-if="!form.batches.length"
          class="rounded-xl bg-surface p-4 text-sm text-muted"
        >
          Nenhum lote adicionado.
        </p>
      </div>
    </section>
    <section
      v-if="form.presential"
      class="rounded-card border border-border bg-white p-6"
    >
      <h2 class="text-xl font-black">
        Detalhes presenciais
      </h2><div class="mt-5 grid gap-5 sm:grid-cols-2">
        <label class="font-bold">Local<input
          v-model="form.presential.location_name"
          required
          class="field"
        ></label><label class="font-bold">Cidade<input
          v-model="form.presential.city"
          required
          class="field"
        ></label><label class="font-bold">UF<input
          v-model="form.presential.state"
          required
          maxlength="2"
          class="field"
        ></label><label class="font-bold">Vagas<input
          v-model.number="form.presential.max_students"
          type="number"
          min="1"
          required
          class="field"
        ></label><label class="font-bold">Início<input
          v-model="form.presential.starts_at"
          type="datetime-local"
          required
          class="field"
        ></label><label class="font-bold">Término<input
          v-model="form.presential.ends_at"
          type="datetime-local"
          required
          class="field"
        ></label><label class="font-bold">Fim das inscrições<input
          v-model="form.presential.registration_deadline"
          type="datetime-local"
          class="field"
        ></label>
      </div>
    </section>
    <section class="rounded-card border border-border bg-white p-6">
      <h2 class="text-xl font-black">
        Detalhes públicos
      </h2><div class="mt-5 grid gap-5">
        <label class="font-bold">Programa<textarea
          v-model="form.program"
          rows="5"
          class="field"
        /></label><label class="font-bold">Requisitos<textarea
          v-model="form.requirements"
          rows="3"
          class="field"
        /></label><label class="font-bold">Público-alvo<textarea
          v-model="form.target_audience"
          rows="3"
          class="field"
        /></label>
      </div>
    </section>
    <section
      v-if="courseId"
      class="rounded-card border border-border bg-white p-6"
    >
      <h2 class="text-xl font-black">
        Capa
      </h2><p class="mt-2 text-sm text-muted">
        JPEG, PNG ou WEBP, até 5 MB.
      </p><div class="mt-4 flex flex-wrap items-end gap-3">
        <label class="font-bold">Arquivo<input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="field"
          @change="cover = ($event.target as HTMLInputElement).files?.[0] ?? null"
        ></label><AppButton
          type="button"
          variant="secondary"
          :disabled="!cover"
          @click="uploadCover"
        >
          Enviar capa
        </AppButton>
      </div>
    </section>
    <p
      v-if="errorMessage"
      role="alert"
      class="rounded-xl bg-red-50 p-4 text-danger"
    >
      {{ errorMessage }}
    </p><p
      v-if="message"
      role="status"
      class="rounded-xl bg-primary-50 p-4 text-success"
    >
      {{ message }}
    </p><div class="flex flex-wrap gap-3">
      <AppButton
        type="submit"
        :disabled="saving"
      >
        {{ saving ? 'Salvando…' : 'Salvar rascunho' }}
      </AppButton><AppButton
        v-if="courseId && form.course_type === 'ONLINE'"
        :to="`/admin/cursos/${courseId}/conteudo`"
        variant="secondary"
      >
        Organizar conteúdo
      </AppButton>
    </div>
  </form>
</template>
