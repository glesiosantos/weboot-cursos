<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Conteúdo do curso | Administração', robots: 'noindex' })
const route = useRoute(); const id = String(route.params.id)
const { data, refresh } = await useFetch(`/api/admin/courses/${id}/content`)
type Knowledge = { id: string, title: string, content_type: string, version: number }
type Assignment = { id: string, is_required: boolean, due_at: string | null, knowledge_items: Knowledge }
const { data: knowledge, refresh: refreshKnowledge } = await useFetch<{ assigned: Assignment[], library: Knowledge[] }>(`/api/admin/courses/${id}/knowledge`)
const moduleTitle = ref(''); const lessonTitles = reactive<Record<string, string>>({}); const errorMessage = ref('')
const materialTitle = ref(''); const materialFile = ref<File | null>(null)
const busy = ref<string | null>(null)
const selectedKnowledge = ref(''); const activityRequired = ref(true); const activityDueAt = ref('')
const addKnowledge = async () => {
  if (!selectedKnowledge.value) { return }
  try { await $fetch(`/api/admin/courses/${id}/knowledge`, { method: 'POST', body: { knowledgeItemId: selectedKnowledge.value, isRequired: activityRequired.value, isPreEvent: true, availableAt: null, dueAt: activityDueAt.value ? new Date(activityDueAt.value).toISOString() : null } }); selectedKnowledge.value = ''; activityDueAt.value = ''; await refreshKnowledge() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível adicionar a atividade' }
}
const removeKnowledge = async (assignmentId: string) => {
  if (!confirm('Remover esta atividade do curso? O material continuará disponível na biblioteca.')) { return }
  await $fetch(`/api/admin/courses/${id}/knowledge/${assignmentId}`, { method: 'DELETE' }); await refreshKnowledge()
}
const addModule = async () => { if (!moduleTitle.value.trim()) { return } await $fetch(`/api/admin/courses/${id}/modules`, { method: 'POST', body: { title: moduleTitle.value } }); moduleTitle.value = ''; await refresh() }
const addLesson = async (moduleId: string) => { const title = lessonTitles[moduleId]?.trim(); if (!title) { return } await $fetch(`/api/admin/modules/${moduleId}/lessons`, { method: 'POST', body: { title, lesson_type: 'TEXT', is_required: true, is_preview: false } }); lessonTitles[moduleId] = ''; await refresh() }
const move = async (moduleIndex: number, direction: -1 | 1) => {
  const modules = data.value?.modules; if (!modules) { return } const target = moduleIndex + direction; if (target < 0 || target >= modules.length) { return } const ids = modules.map(module => module.id); [ids[moduleIndex], ids[target]] = [ids[target]!, ids[moduleIndex]!]; try { await $fetch(`/api/admin/courses/${id}/reorder`, { method: 'PUT', body: { type: 'module', ids, parent_id: id } }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao reordenar' }
}
const updateModule = async (module: NonNullable<typeof data.value>['modules'][number]) => {
  busy.value = module.id
  try { await $fetch(`/api/admin/modules/${module.id}`, { method: 'PUT', body: { title: module.title, description: module.description } }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao editar módulo' }
  finally { busy.value = null }
}
const removeModule = async (module: NonNullable<typeof data.value>['modules'][number]) => {
  if (!confirm(`Remover o módulo “${module.title}” e suas aulas? Esta ação não pode ser desfeita.`)) { return }
  busy.value = module.id
  try { await $fetch(`/api/admin/modules/${module.id}`, { method: 'DELETE' }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao remover módulo' }
  finally { busy.value = null }
}
const updateLesson = async (lesson: NonNullable<typeof data.value>['modules'][number]['lessons'][number]) => {
  busy.value = lesson.id
  try { await $fetch(`/api/admin/lessons/${lesson.id}`, { method: 'PUT', body: { title: lesson.title, description: lesson.description, lesson_type: lesson.lesson_type, content: lesson.content, video_path: lesson.video_path, duration_minutes: lesson.duration_minutes, is_required: lesson.is_required, is_preview: lesson.is_preview } }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao editar aula' }
  finally { busy.value = null }
}
const removeLesson = async (lesson: NonNullable<typeof data.value>['modules'][number]['lessons'][number]) => {
  if (!confirm(`Remover a aula “${lesson.title}”? Esta ação não pode ser desfeita.`)) { return }
  busy.value = lesson.id
  try { await $fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao remover aula' }
  finally { busy.value = null }
}
const moveLesson = async (module: NonNullable<typeof data.value>['modules'][number], lessonIndex: number, direction: -1 | 1) => {
  const target = lessonIndex + direction
  if (target < 0 || target >= module.lessons.length) { return }
  const ids = module.lessons.map(lesson => lesson.id); [ids[lessonIndex], ids[target]] = [ids[target]!, ids[lessonIndex]!]
  try { await $fetch(`/api/admin/courses/${id}/reorder`, { method: 'PUT', body: { type: 'lesson', ids, parent_id: module.id } }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao reordenar aulas' }
}
const uploadMaterial = async () => {
  if (!materialTitle.value.trim() || !materialFile.value) { return }
  const body = new FormData(); body.append('title', materialTitle.value); body.append('file', materialFile.value)
  try { await $fetch(`/api/admin/courses/${id}/materials`, { method: 'POST', body }); materialTitle.value = ''; materialFile.value = null; await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao enviar material' }
}
const removeMaterial = async (material: NonNullable<typeof data.value>['materials'][number]) => {
  if (!confirm(`Remover o material “${material.title}”?`)) { return }
  busy.value = material.id
  try { await $fetch(`/api/admin/courses/${id}/materials/${material.id}`, { method: 'DELETE' }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao remover material' }
  finally { busy.value = null }
}
const fileSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
</script>

<template>
  <section>
    <AppBadge>COURSE BUILDER</AppBadge><h1 class="mt-3 text-3xl font-black">
      Curso: {{ data?.course.title }}
    </h1><p
      v-if="errorMessage"
      role="alert"
      class="mt-5 text-danger"
    >
      {{ errorMessage }}
    </p><div class="mt-8 space-y-5">
      <article
        v-for="(module, index) in data?.modules"
        :key="module.id"
        class="rounded-card border border-border bg-white p-4 sm:p-6"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-muted">
              MÓDULO {{ index + 1 }}
            </p><label
              class="sr-only"
              :for="`module-name-${module.id}`"
            >Título do módulo</label><input
              :id="`module-name-${module.id}`"
              v-model="module.title"
              class="field !mt-1 text-xl font-black"
            >
          </div><div class="flex gap-2">
            <button
              type="button"
              :disabled="index === 0"
              :aria-label="`Mover ${module.title} para cima`"
              class="rounded-lg border border-border px-3 py-2 disabled:opacity-30"
              @click="move(index, -1)"
            >
              ↑
            </button><button
              type="button"
              :disabled="index === (data?.modules.length ?? 0) - 1"
              :aria-label="`Mover ${module.title} para baixo`"
              class="rounded-lg border border-border px-3 py-2 disabled:opacity-30"
              @click="move(index, 1)"
            >
              ↓
            </button>
          </div>
        </div><div class="mt-3 flex flex-wrap gap-3">
          <button
            class="text-sm font-bold text-primary-700"
            :disabled="busy === module.id"
            @click="updateModule(module)"
          >
            Salvar módulo
          </button><button
            class="text-sm font-bold text-danger"
            :disabled="busy === module.id"
            @click="removeModule(module)"
          >
            Remover módulo
          </button>
        </div><ol class="mt-5 space-y-2">
          <li
            v-for="(lesson, lessonIndex) in module.lessons"
            :key="lesson.id"
            class="rounded-xl bg-canvas px-4 py-3 text-sm"
          >
            <div class="flex flex-wrap items-center gap-2">
              <b>Aula {{ lessonIndex + 1 }}</b><label
                class="sr-only"
                :for="`lesson-name-${lesson.id}`"
              >Título da aula</label><input
                :id="`lesson-name-${lesson.id}`"
                v-model="lesson.title"
                class="field !mt-0 min-w-0 flex-1 basis-full sm:basis-auto"
              ><AppBadge v-if="lesson.is_preview">
                Preview
              </AppBadge>
            </div>
            <div class="mt-2 flex flex-wrap gap-3">
              <button
                :disabled="lessonIndex === 0"
                :aria-label="`Mover ${lesson.title} para cima`"
                @click="moveLesson(module, lessonIndex, -1)"
              >
                ↑
              </button><button
                :disabled="lessonIndex === module.lessons.length - 1"
                :aria-label="`Mover ${lesson.title} para baixo`"
                @click="moveLesson(module, lessonIndex, 1)"
              >
                ↓
              </button><button
                class="font-bold text-primary-700"
                :disabled="busy === lesson.id"
                @click="updateLesson(lesson)"
              >
                Salvar aula
              </button><button
                class="font-bold text-danger"
                :disabled="busy === lesson.id"
                @click="removeLesson(lesson)"
              >
                Remover aula
              </button>
            </div>
          </li>
        </ol><form
          class="mt-4 flex flex-col gap-2 sm:flex-row"
          @submit.prevent="addLesson(module.id)"
        >
          <label
            class="sr-only"
            :for="`lesson-${module.id}`"
          >Título da aula</label><input
            :id="`lesson-${module.id}`"
            v-model="lessonTitles[module.id]"
            placeholder="Título da nova aula"
            class="field !mt-0"
          ><AppButton
            type="submit"
            variant="secondary"
          >
            + Aula
          </AppButton>
        </form>
      </article>
    </div><form
      class="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
      @submit.prevent="addModule"
    >
      <label
        for="module-title"
        class="sr-only"
      >Título do módulo</label><input
        id="module-title"
        v-model="moduleTitle"
        placeholder="Título do novo módulo"
        class="field !mt-0"
      ><AppButton type="submit">
        + Novo módulo
      </AppButton>
    </form>
    <section class="mt-8 rounded-card border border-border bg-white p-4 sm:p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-xl font-black">
            Preparação para o evento
          </h2><p class="mt-2 text-sm text-muted">
            Associe conteúdos publicados e reutilizáveis da biblioteca.
          </p>
        </div><NuxtLink
          to="/admin/biblioteca"
          class="font-bold text-primary-700"
        >Abrir biblioteca →</NuxtLink>
      </div>
      <form
        class="mt-5 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end"
        @submit.prevent="addKnowledge"
      >
        <label class="font-bold">Material<select
          v-model="selectedKnowledge"
          required
          class="field"
        ><option
          value=""
          disabled
        >Selecione</option><option
          v-for="item in knowledge?.library"
          :key="item.id"
          :value="item.id"
        >{{ item.title }} · {{ item.content_type }}</option></select></label>
        <label class="font-bold">Prazo<input
          v-model="activityDueAt"
          type="datetime-local"
          class="field"
        ></label>
        <label class="flex min-h-11 items-center gap-2 font-bold"><input
          v-model="activityRequired"
          type="checkbox"
        > Obrigatória</label><AppButton type="submit">
          Adicionar
        </AppButton>
      </form>
      <ul
        v-if="knowledge?.assigned.length"
        class="mt-6 space-y-3"
      >
        <li
          v-for="assignment in knowledge.assigned"
          :key="assignment.id"
          class="flex flex-col gap-3 rounded-xl bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="font-black">
              {{ assignment.knowledge_items.title }}
            </p><p class="mt-1 text-xs text-muted">
              {{ assignment.knowledge_items.content_type }} · versão {{ assignment.knowledge_items.version }} · {{ assignment.is_required ? 'Obrigatória' : 'Opcional' }}<template v-if="assignment.due_at">
                · até {{ new Date(assignment.due_at).toLocaleString('pt-BR') }}
              </template>
            </p>
          </div><button
            type="button"
            class="font-bold text-danger"
            @click="removeKnowledge(assignment.id)"
          >
            Remover do curso
          </button>
        </li>
      </ul>
      <p
        v-else
        class="mt-5 text-sm text-muted"
      >
        Nenhuma atividade pré-evento associada.
      </p>
    </section>
    <form
      class="mt-8 max-w-2xl rounded-card border border-border bg-white p-4 sm:p-6"
      @submit.prevent="uploadMaterial"
    >
      <h2 class="text-xl font-black">
        Material do curso
      </h2><p class="mt-2 text-sm text-muted">
        PDF, DOCX, PPTX, XLSX ou ZIP, até 50 MB. O arquivo permanece privado.
      </p><label class="mt-4 block font-bold">Título<input
        v-model="materialTitle"
        required
        class="field"
      ></label><label class="mt-4 block font-bold">Arquivo<input
        type="file"
        required
        accept=".pdf,.docx,.pptx,.xlsx,.zip"
        class="field"
        @change="materialFile = ($event.target as HTMLInputElement).files?.[0] ?? null"
      ></label><AppButton
        type="submit"
        class="mt-4"
      >
        Enviar material
      </AppButton><div
        v-if="data?.materials.length"
        class="mt-6 border-t border-border pt-5"
      >
        <h3 class="font-black">
          Materiais anexados
        </h3><ul class="mt-3 space-y-3">
          <li
            v-for="material in data.materials"
            :key="material.id"
            class="flex flex-col items-start gap-3 rounded-xl bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="font-bold">
                {{ material.title }}
              </p><p class="text-xs text-muted">
                {{ material.mime_type }} · {{ fileSize(material.file_size) }}
              </p>
            </div><button
              type="button"
              class="text-sm font-bold text-danger"
              :disabled="busy === material.id"
              @click="removeMaterial(material)"
            >
              Remover
            </button>
          </li>
        </ul>
      </div><p
        v-else
        class="mt-6 border-t border-border pt-5 text-sm text-muted"
      >
        Nenhum material anexado.
      </p>
    </form>
  </section>
</template>
