<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Biblioteca de conhecimento | Administração', robots: 'noindex' })
type Item = { id: string, title: string, summary: string | null, content_type: 'POST' | 'PDF' | 'VIDEO', content: string | null, external_url: string | null, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', version: number, course_knowledge_items: { id: string }[] }
const { data: items, refresh } = await useFetch<Item[]>('/api/admin/knowledge')
const form = reactive({ title: '', summary: '', contentType: 'POST' as Item['content_type'], content: '', externalUrl: '', status: 'DRAFT' as Item['status'] })
const media = ref<File | null>(null)
const images = ref<File[]>([])
const imageAlts = ref<string[]>([])
const busy = ref(false); const message = ref(''); const errorMessage = ref('')
const createItem = async () => {
  busy.value = true; message.value = ''; errorMessage.value = ''
  const body = new FormData()
  for (const [key, value] of Object.entries(form)) { body.append(key, value) }
  if (media.value) { body.append('media', media.value) }
  images.value.forEach((image, index) => { body.append('images', image); body.append('imageAlt', imageAlts.value[index] ?? '') })
  try {
    await $fetch('/api/admin/knowledge', { method: 'POST', body })
    Object.assign(form, { title: '', summary: '', contentType: 'POST', content: '', externalUrl: '', status: 'DRAFT' })
    media.value = null; images.value = []; imageAlts.value = []; message.value = 'Material criado com sucesso.'; await refresh()
  }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível criar o material' }
  finally { busy.value = false }
}
const save = async (item: Item) => {
  errorMessage.value = ''; message.value = ''
  try { await $fetch(`/api/admin/knowledge/${item.id}`, { method: 'PUT', body: { title: item.title, summary: item.summary, content: item.content, status: item.status } }); message.value = 'Material atualizado e uma nova versão foi registrada.'; await refresh() }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível atualizar o material' }
}
const onImages = (event: Event) => { images.value = [...((event.target as HTMLInputElement).files ?? [])]; imageAlts.value = images.value.map(() => '') }
const typeLabel = (type: Item['content_type']) => ({ POST: 'Post', PDF: 'PDF', VIDEO: 'Vídeo' }[type])
</script>

<template>
  <section>
    <AppBadge>BASE DE CONHECIMENTO</AppBadge><h1 class="mt-3 text-3xl font-black">
      Biblioteca
    </h1><p class="mt-2 max-w-3xl text-muted">
      Crie uma vez e reutilize posts, PDFs e vídeos como preparação em diferentes cursos.
    </p>
    <p
      v-if="message"
      role="status"
      class="mt-5 text-sm font-bold text-green-700"
    >
      {{ message }}
    </p><p
      v-if="errorMessage"
      role="alert"
      class="mt-5 text-sm font-bold text-danger"
    >
      {{ errorMessage }}
    </p>
    <form
      class="mt-7 rounded-card border border-border bg-white p-4 sm:p-6"
      @submit.prevent="createItem"
    >
      <h2 class="text-xl font-black">
        Novo material
      </h2><div class="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
        <label class="font-bold">Título<input
          v-model="form.title"
          required
          minlength="3"
          maxlength="160"
          class="field"
        ></label>
        <label class="font-bold">Tipo<select
          v-model="form.contentType"
          class="field"
        ><option value="POST">Post</option><option value="PDF">PDF</option><option value="VIDEO">Vídeo</option></select></label>
        <label class="font-bold md:col-span-2">Resumo<textarea
          v-model="form.summary"
          rows="2"
          class="field"
        /></label>
        <label
          v-if="form.contentType === 'POST'"
          class="font-bold md:col-span-2"
        >Conteúdo do passo a passo<textarea
          v-model="form.content"
          required
          rows="10"
          class="field font-mono"
          placeholder="Descreva os passos, comandos e orientações..."
        /></label>
        <label
          v-if="form.contentType === 'PDF'"
          class="font-bold md:col-span-2"
        >Arquivo PDF<input
          type="file"
          required
          accept="application/pdf,.pdf"
          class="field"
          @change="media = ($event.target as HTMLInputElement).files?.[0] ?? null"
        ></label>
        <template v-if="form.contentType === 'VIDEO'">
          <label class="font-bold">Arquivo MP4/WebM<input
            type="file"
            accept="video/mp4,video/webm"
            class="field"
            @change="media = ($event.target as HTMLInputElement).files?.[0] ?? null"
          ></label><label class="font-bold">Ou URL HTTPS<input
            v-model="form.externalUrl"
            type="url"
            placeholder="https://..."
            class="field"
          ></label>
        </template>
        <template v-if="form.contentType === 'POST'">
          <label class="font-bold md:col-span-2">Imagens do post<input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            class="field"
            @change="onImages"
          ></label><label
            v-for="(image, index) in images"
            :key="`${image.name}-${index}`"
            class="font-bold"
          >Texto alternativo — {{ image.name }}<input
            v-model="imageAlts[index]"
            required
            maxlength="200"
            class="field"
          ></label>
        </template>
        <label class="font-bold">Situação<select
          v-model="form.status"
          class="field"
        ><option value="DRAFT">Rascunho</option><option value="PUBLISHED">Publicado</option></select></label>
      </div><AppButton
        type="submit"
        class="mt-5"
        :disabled="busy"
      >
        {{ busy ? 'Salvando…' : 'Criar material' }}
      </AppButton>
    </form>
    <section class="mt-8">
      <h2 class="text-2xl font-black">
        Materiais cadastrados
      </h2><div
        v-if="items?.length"
        class="mt-5 grid gap-4 xl:grid-cols-2"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="rounded-card border border-border bg-white p-5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge>{{ typeLabel(item.content_type) }}</AppBadge><AppBadge>{{ item.status }}</AppBadge><span class="text-xs text-muted">Versão {{ item.version }} · {{ item.course_knowledge_items.length }} curso(s)</span>
          </div>
          <label class="mt-4 block font-bold">Título<input
            v-model="item.title"
            class="field"
          ></label><label class="mt-3 block font-bold">Resumo<textarea
            v-model="item.summary"
            rows="2"
            class="field"
          /></label><label
            v-if="item.content_type === 'POST'"
            class="mt-3 block font-bold"
          >Conteúdo<textarea
            v-model="item.content"
            rows="8"
            class="field font-mono"
          /></label>
          <label class="mt-3 block font-bold">Situação<select
            v-model="item.status"
            class="field"
          ><option value="DRAFT">Rascunho</option><option value="PUBLISHED">Publicado</option><option value="ARCHIVED">Arquivado</option></select></label><AppButton
            class="mt-4"
            variant="secondary"
            @click="save(item)"
          >
            Salvar nova versão
          </AppButton>
        </article>
      </div><p
        v-else
        class="mt-5 rounded-card border border-dashed border-border p-8 text-center text-muted"
      >
        Nenhum material na biblioteca.
      </p>
    </section>
  </section>
</template>
