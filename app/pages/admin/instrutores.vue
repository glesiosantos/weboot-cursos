<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Instrutores | Administração', robots: 'noindex' })
const { data: instructors, refresh } = await useFetch('/api/admin/instructors')
const form = reactive({ name: '', bio: '', linkedin_url: '', active: true })
const save = async () => { await $fetch('/api/admin/instructors', { method: 'POST', body: { ...form, bio: form.bio || null, linkedin_url: form.linkedin_url || null } }); form.name = ''; form.bio = ''; form.linkedin_url = ''; await refresh() }
const toggle = async (instructor: NonNullable<typeof instructors.value>[number]) => { await $fetch(`/api/admin/instructors/${instructor.id}`, { method: 'PUT', body: { name: instructor.name, bio: instructor.bio, linkedin_url: instructor.linkedin_url, active: !instructor.active } }); await refresh() }
</script>

<template>
  <section>
    <AppBadge>EQUIPE</AppBadge><h1 class="mt-3 text-3xl font-black">
      Instrutores
    </h1><form
      class="mt-8 grid gap-4 rounded-card border border-border bg-white p-6 sm:grid-cols-2"
      @submit.prevent="save"
    >
      <label class="font-bold">Nome<input
        v-model="form.name"
        required
        class="field"
      ></label><label class="font-bold">LinkedIn<input
        v-model="form.linkedin_url"
        type="url"
        class="field"
      ></label><label class="font-bold sm:col-span-2">Biografia<textarea
        v-model="form.bio"
        rows="4"
        class="field"
      /></label><AppButton type="submit">
        Adicionar instrutor
      </AppButton>
    </form><div class="mt-6 grid gap-4 sm:grid-cols-2">
      <article
        v-for="instructor in instructors"
        :key="instructor.id"
        class="rounded-card border border-border bg-white p-5"
      >
        <div class="flex justify-between gap-3">
          <h2 class="font-black">
            {{ instructor.name }}
          </h2><AppBadge>{{ instructor.active ? 'ATIVO' : 'INATIVO' }}</AppBadge>
        </div><p class="mt-3 text-sm text-muted">
          {{ instructor.bio || 'Sem biografia.' }}
        </p><button
          class="mt-4 text-sm font-bold text-primary-700"
          @click="toggle(instructor)"
        >
          {{ instructor.active ? 'Desativar' : 'Ativar' }}
        </button>
      </article>
    </div>
  </section>
</template>
