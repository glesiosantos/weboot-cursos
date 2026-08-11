<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Conteúdo do curso | Administração', robots: 'noindex' })
const route = useRoute(); const id = String(route.params.id)
const { data, refresh } = await useFetch(`/api/admin/courses/${id}/content`)
const moduleTitle = ref(''); const lessonTitles = reactive<Record<string, string>>({}); const errorMessage = ref('')
const materialTitle = ref(''); const materialFile = ref<File | null>(null)
const addModule = async () => { if (!moduleTitle.value.trim()) { return } await $fetch(`/api/admin/courses/${id}/modules`, { method: 'POST', body: { title: moduleTitle.value } }); moduleTitle.value = ''; await refresh() }
const addLesson = async (moduleId: string) => { const title = lessonTitles[moduleId]?.trim(); if (!title) { return } await $fetch(`/api/admin/modules/${moduleId}/lessons`, { method: 'POST', body: { title, lesson_type: 'TEXT', is_required: true, is_preview: false } }); lessonTitles[moduleId] = ''; await refresh() }
const move = async (moduleIndex: number, direction: -1 | 1) => {
  const modules = data.value?.modules; if (!modules) { return } const target = moduleIndex + direction; if (target < 0 || target >= modules.length) { return } const ids = modules.map(module => module.id); [ids[moduleIndex], ids[target]] = [ids[target]!, ids[moduleIndex]!]; try { await $fetch(`/api/admin/courses/${id}/reorder`, { method: 'PUT', body: { type: 'module', ids, parent_id: id } }); await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao reordenar' }
}
const uploadMaterial = async () => {
  if (!materialTitle.value.trim() || !materialFile.value) { return }
  const body = new FormData(); body.append('title', materialTitle.value); body.append('file', materialFile.value)
  try { await $fetch(`/api/admin/courses/${id}/materials`, { method: 'POST', body }); materialTitle.value = ''; materialFile.value = null }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Falha ao enviar material' }
}
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
        class="rounded-card border border-border bg-white p-6"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-muted">
              MÓDULO {{ index + 1 }}
            </p><h2 class="text-xl font-black">
              {{ module.title }}
            </h2>
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
        </div><ol class="mt-5 space-y-2">
          <li
            v-for="(lesson, lessonIndex) in module.lessons"
            :key="lesson.id"
            class="rounded-xl bg-canvas px-4 py-3 text-sm"
          >
            <b>Aula {{ lessonIndex + 1 }}</b> — {{ lesson.title }} <AppBadge v-if="lesson.is_preview">
              Preview
            </AppBadge>
          </li>
        </ol><form
          class="mt-4 flex gap-2"
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
      class="mt-6 flex max-w-xl gap-2"
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
    <form
      class="mt-8 max-w-2xl rounded-card border border-border bg-white p-6"
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
      </AppButton>
    </form>
  </section>
</template>
