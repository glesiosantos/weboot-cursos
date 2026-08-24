<script setup lang="ts">
import type { CourseBatchActivationMode, CourseBatchStatus, CoursePricingType, CourseStatus, CourseType, Database } from '~/types/database.types'

interface BatchForm { name: string, position: number, price: number, max_sales: number | null, starts_at: string | null, ends_at: string | null, status: CourseBatchStatus, activation_mode: CourseBatchActivationMode }
interface FormData { title: string, slug: string, short_description: string, description: string, course_type: CourseType, instructor_id: string | null, workload_hours: number, price: number, promotional_price: number | null, pricing_type: CoursePricingType, show_future_batches: boolean, batches: BatchForm[], status: CourseStatus, program: string | null, requirements: string | null, target_audience: string | null, cover_path: string | null, folder_path: string | null, folder_alt_text: string | null, folder_mime_type: string | null, folder_original_name: string | null, presential: { location_name: string, city: string, state: string, starts_at: string, ends_at: string, registration_deadline: string | null, max_students: number } | null }
const props = defineProps<{ courseId?: string, initial?: Partial<FormData> }>()
const emit = defineEmits<{ saved: [id: string] }>()
const storageClient = useSupabaseClient<Database>()
const { data: instructors } = await useAsyncData('admin-instructors', async () => {
  const client = useSupabaseClient()
  const { data, error } = await client.from('instructors').select('id,name,active').order('name')
  if (error) { throw error }
  return data
})
const form = reactive<FormData>({ title: '', slug: '', short_description: '', description: '', course_type: 'ONLINE', instructor_id: null, workload_hours: 1, price: 0, promotional_price: null, pricing_type: 'FIXED', show_future_batches: false, batches: [], status: 'DRAFT', program: null, requirements: null, target_audience: null, cover_path: null, folder_path: null, folder_alt_text: null, folder_mime_type: null, folder_original_name: null, presential: null, ...props.initial })
const dirty = ref(false); const saving = ref(false); const message = ref(''); const errorMessage = ref(''); const slugTouched = ref(Boolean(props.initial?.slug))
const cover = ref<File | null>(null)
const folder = ref<File | null>(null)
const coverUrl = computed(() => form.cover_path ? storageClient.storage.from('course-covers').getPublicUrl(form.cover_path).data.publicUrl : null)
const folderUrl = computed(() => form.folder_path ? storageClient.storage.from('course-public-assets').getPublicUrl(form.folder_path).data.publicUrl : null)
watch(form, () => { dirty.value = true }, { deep: true })
watch(() => form.title, (value) => { if (!slugTouched.value) { form.slug = normalizeSlug(value) } })
watch(() => form.course_type, (value) => { if (value === 'PRESENCIAL' && !form.presential) { form.presential = { location_name: '', city: '', state: '', starts_at: '', ends_at: '', registration_deadline: null, max_students: 1 } } if (value === 'ONLINE') { form.presential = null } })
const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.value) { event.preventDefault() } }
onMounted(() => window.addEventListener('beforeunload', beforeUnload)); onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => !dirty.value || window.confirm('Você possui alterações não salvas. Deseja sair?'))
const asIso = (value: string | null) => value ? new Date(value).toISOString() : null
const normalizePositions = () => form.batches.forEach((batch, index) => { batch.position = index + 1 })
const addBatch = () => { form.batches.push({ name: `${form.batches.length + 1}º lote`, position: form.batches.length + 1, price: 0, max_sales: 1, starts_at: null, ends_at: null, status: 'DRAFT', activation_mode: 'QUANTITY' }) }
const removeBatch = (index: number) => { form.batches.splice(index, 1); normalizePositions() }
const moveBatch = (index: number, offset: number) => { const target = index + offset; if (target < 0 || target >= form.batches.length) { return } const [batch] = form.batches.splice(index, 1); form.batches.splice(target, 0, batch!); normalizePositions() }
const submit = async () => {
  saving.value = true; errorMessage.value = ''; message.value = ''
  try {
    const payload = { ...form, batches: form.pricing_type === 'BATCHES' ? form.batches.map(batch => ({ ...batch, starts_at: asIso(batch.starts_at), ends_at: asIso(batch.ends_at) })) : [], presential: form.presential ? { ...form.presential, starts_at: asIso(form.presential.starts_at), ends_at: asIso(form.presential.ends_at), registration_deadline: asIso(form.presential.registration_deadline) } : null }
    const saved = await $fetch<{ id: string }>(props.courseId ? `/api/admin/courses/${props.courseId}` : '/api/admin/courses', { method: props.courseId ? 'PUT' : 'POST', body: payload })
    dirty.value = false; message.value = 'Curso salvo com sucesso.'; emit('saved', saved.id); return true
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível salvar o curso.'; return false }
  finally { saving.value = false }
}
const openPreview = async () => {
  if (!props.courseId) { return }
  if (dirty.value && !window.confirm('Existem alterações não salvas. Salvar e visualizar o preview?')) { return }
  if (dirty.value && !await submit()) { return }
  await navigateTo(`/admin/cursos/${props.courseId}/preview`)
}
const togglePublication = async () => {
  if (!props.courseId) { return }
  errorMessage.value = ''
  try {
    if (dirty.value && !await submit()) { return }
    const action = form.status === 'PUBLISHED' ? 'unpublish' : 'publish'
    await $fetch(`/api/admin/courses/${props.courseId}/${action}`, { method: 'POST' })
    form.status = action === 'publish' ? 'PUBLISHED' : 'DRAFT'
    message.value = action === 'publish' ? 'Curso publicado com sucesso.' : 'Curso despublicado com sucesso.'
  }
  catch (error) { errorMessage.value = apiErrorMessage(error, 'Não foi possível alterar a publicação.') }
}
const uploadCover = async () => {
  if (!props.courseId || !cover.value) { return }
  const body = new FormData()
  body.append('file', cover.value)
  try { const saved = await $fetch<{ path: string }>(`/api/admin/courses/${props.courseId}/cover`, { method: 'POST', body }); form.cover_path = saved.path; message.value = 'Capa enviada com sucesso.'; cover.value = null }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao enviar a capa.' }
}
const removeCover = async () => {
  if (!props.courseId || !form.cover_path || !window.confirm('Remover a capa deste curso?')) { return }
  try {
    await $fetch(`/api/admin/courses/${props.courseId}/cover`, { method: 'DELETE' })
    form.cover_path = null
    message.value = 'Capa removida sem alterar o folder promocional.'
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao remover a capa.' }
}
const uploadFolder = async () => {
  if (!props.courseId || !folder.value) { return }
  const body = new FormData()
  body.append('file', folder.value)
  if (form.folder_alt_text) { body.append('alt_text', form.folder_alt_text) }
  try {
    const saved = await $fetch<{ path: string, mime_type: string, original_name: string, alt_text: string | null }>(`/api/admin/courses/${props.courseId}/folder`, { method: 'POST', body })
    form.folder_path = saved.path; form.folder_mime_type = saved.mime_type; form.folder_original_name = saved.original_name; form.folder_alt_text = saved.alt_text
    folder.value = null; message.value = 'Folder enviado com sucesso.'
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao enviar o folder.' }
}
const removeFolder = async () => {
  if (!props.courseId || !form.folder_path || !window.confirm('Remover o folder promocional deste curso?')) { return }
  try {
    await $fetch(`/api/admin/courses/${props.courseId}/folder`, { method: 'DELETE' })
    form.folder_path = null; form.folder_mime_type = null; form.folder_original_name = null; form.folder_alt_text = null
    message.value = 'Folder removido sem alterar a capa do curso.'
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao remover o folder.' }
}
</script>

<template>
  <form
    class="mt-8 space-y-6"
    @submit.prevent="submit"
  >
    <div
      v-if="courseId"
      class="flex flex-wrap items-center gap-3 rounded-card border border-border bg-white p-4"
    >
      <AppButton type="submit">
        {{ saving ? 'Salvando…' : 'Salvar' }}
      </AppButton><AppButton
        type="button"
        variant="secondary"
        @click="openPreview"
      >
        Preview
      </AppButton><AppButton
        v-if="form.status !== 'PUBLISHED'"
        type="button"
        variant="secondary"
        @click="togglePublication"
      >
        Publicar
      </AppButton><template v-else>
        <AppButton
          :to="`/cursos/${form.slug}`"
          variant="secondary"
        >
          Visualizar
        </AppButton><button
          type="button"
          class="rounded-xl border border-border px-4 py-3 font-bold"
          @click="togglePublication"
        >
          Despublicar
        </button>
      </template>
    </div>
    <section class="rounded-card border border-border bg-white p-4 sm:p-6">
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
    <section class="rounded-card border border-border bg-white p-4 sm:p-6">
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
          min="1"
          step="1"
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
      class="rounded-card border border-border bg-white p-4 sm:p-6"
    >
      <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
      <label class="mt-4 flex items-center gap-2 font-bold"><input
        v-model="form.show_future_batches"
        type="checkbox"
      > Mostrar próximos lotes publicamente</label>
      <div class="mt-5 space-y-4">
        <article
          v-for="(batch, index) in form.batches"
          :key="index"
          class="rounded-xl border border-border p-5"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="font-black">
              {{ batch.name || `${index + 1}º lote` }}
            </h3><div class="flex flex-wrap gap-2">
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
            <label class="font-bold">Limite de vendas<input
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
      class="rounded-card border border-border bg-white p-4 sm:p-6"
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
    <section class="rounded-card border border-border bg-white p-4 sm:p-6">
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
      class="rounded-card border border-border bg-white p-4 sm:p-6"
    >
      <h2 class="text-xl font-black">
        Mídia do curso
      </h2><div class="mt-5 grid gap-5 lg:grid-cols-2">
        <article class="rounded-xl border border-border p-5">
          <h3 class="font-black">
            Capa do curso
          </h3><p class="mt-1 text-sm text-muted">
            Usada nos cards, catálogo e compartilhamento. JPEG, PNG ou WEBP, até 5 MB.
          </p><img
            v-if="coverUrl"
            :src="coverUrl"
            :alt="`Capa do curso ${form.title}`"
            class="mt-4 aspect-video w-full rounded-xl object-cover"
          ><div class="mt-4 flex flex-wrap items-end gap-3">
            <label class="min-w-0 flex-1 font-bold">{{ coverUrl ? 'Alterar capa' : 'Enviar capa' }}<input
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
              Enviar
            </AppButton><button
              v-if="coverUrl"
              type="button"
              class="rounded-lg border border-red-200 px-4 py-3 font-bold text-danger"
              @click="removeCover"
            >
              Remover
            </button>
          </div>
        </article>
        <article class="rounded-xl border border-border p-5">
          <h3 class="font-black">
            Folder promocional
          </h3><p class="mt-1 text-sm text-muted">
            Para melhor resultado, utilize uma arte vertical (1080x1350 ou 1080x1920).
          </p>
          <img
            v-if="folderUrl && form.folder_mime_type !== 'application/pdf'"
            :src="folderUrl"
            :alt="form.folder_alt_text || `Folder promocional do curso ${form.title}`"
            class="mx-auto mt-4 max-h-96 w-full rounded-xl object-contain"
          ><div
            v-else-if="folderUrl"
            class="mt-4 rounded-xl bg-surface p-5"
          >
            <p class="font-extrabold">
              Folder em PDF
            </p><a
              :href="folderUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 inline-block font-bold text-primary underline"
            >Visualizar</a>
          </div>
          <p
            v-if="form.folder_original_name"
            class="mt-3 break-all text-sm text-muted"
          >
            {{ form.folder_original_name }} · {{ form.folder_mime_type }}
          </p>
          <label class="mt-4 block font-bold">Texto alternativo<input
            v-model="form.folder_alt_text"
            maxlength="240"
            placeholder="Folder promocional do curso…"
            class="field"
          ></label><div class="mt-4 flex flex-wrap items-end gap-3">
            <label class="min-w-0 flex-1 font-bold">{{ folderUrl ? 'Substituir folder' : 'Enviar folder' }}<input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
              class="field"
              @change="folder = ($event.target as HTMLInputElement).files?.[0] ?? null"
            ></label><AppButton
              type="button"
              variant="secondary"
              :disabled="!folder"
              @click="uploadFolder"
            >
              Enviar
            </AppButton><button
              v-if="folderUrl"
              type="button"
              class="rounded-lg border border-red-200 px-4 py-3 font-bold text-danger"
              @click="removeFolder"
            >
              Remover
            </button>
          </div><p class="mt-3 text-xs text-muted">
            Imagens até 10 MB; PDF até 15 MB.
          </p>
        </article>
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
