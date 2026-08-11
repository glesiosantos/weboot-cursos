<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Cursos | Administração', robots: 'noindex' })
const { data: courses, pending, refresh, error } = await useFetch('/api/admin/courses')
const busy = ref<string | null>(null)
const action = async (id: string, name: 'publish' | 'unpublish' | 'archive' | 'duplicate') => {
  busy.value = id
  try { await $fetch(`/api/admin/courses/${id}/${name}`, { method: 'POST' }); await refresh() }
  finally { busy.value = null }
}
</script>

<template>
  <section>
    <header class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <AppBadge>GESTÃO</AppBadge><h1 class="mt-3 text-3xl font-black">
          Cursos
        </h1><p class="mt-2 text-muted">
          Crie, publique e organize o catálogo.
        </p>
      </div><AppButton to="/admin/cursos/novo">
        + Novo curso
      </AppButton>
    </header>
    <p
      v-if="error"
      role="alert"
      class="mt-8 rounded-xl bg-red-50 p-4 text-danger"
    >
      Não foi possível carregar os cursos.
    </p>
    <div
      v-else-if="pending"
      class="mt-8 space-y-3"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="h-20 animate-pulse rounded-xl bg-white"
      />
    </div>
    <div
      v-else-if="courses?.length"
      class="mt-8"
    >
      <div class="hidden overflow-hidden rounded-card border border-border bg-white md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-canvas text-xs uppercase text-muted">
            <tr>
              <th class="p-4">
                Curso
              </th><th>Tipo</th><th>Instrutor</th><th>Status</th><th>Preço</th><th>Atualizado em</th><th class="p-4">
                Ações
              </th>
            </tr>
          </thead><tbody>
            <tr
              v-for="course in courses"
              :key="course.id"
              class="border-t border-border"
            >
              <td class="p-4 font-bold">
                {{ course.title }}
              </td><td>{{ course.course_type }}</td><td>{{ Array.isArray(course.instructors) ? course.instructors[0]?.name : course.instructors?.name || '—' }}</td><td><AppBadge>{{ course.archived_at ? 'ARQUIVADO' : course.status }}</AppBadge></td><td>{{ formatPrice(Number(course.promotional_price ?? course.price)) }}</td><td>{{ new Date(course.updated_at).toLocaleDateString('pt-BR') }}</td><td class="p-4">
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    :to="`/admin/cursos/${course.id}`"
                    class="font-bold text-primary-700"
                  >Editar</NuxtLink><NuxtLink
                    :to="`/cursos/${course.slug}`"
                    class="font-bold text-primary-700"
                  >Visualizar</NuxtLink><button
                    :disabled="busy === course.id"
                    class="font-bold text-primary-700"
                    @click="action(course.id, 'duplicate')"
                  >
                    Duplicar
                  </button><button
                    v-if="course.status === 'PUBLISHED'"
                    class="font-bold text-primary-700"
                    @click="action(course.id, 'unpublish')"
                  >
                    Despublicar
                  </button><button
                    v-else
                    class="font-bold text-primary-700"
                    @click="action(course.id, 'publish')"
                  >
                    Publicar
                  </button><button
                    class="font-bold text-danger"
                    @click="action(course.id, 'archive')"
                  >
                    Arquivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="grid gap-4 md:hidden">
        <article
          v-for="course in courses"
          :key="course.id"
          class="rounded-card border border-border bg-white p-5"
        >
          <div class="flex justify-between gap-3">
            <h2 class="font-black">
              {{ course.title }}
            </h2><AppBadge>{{ course.status }}</AppBadge>
          </div><p class="mt-2 text-xs font-bold text-muted">
            {{ course.course_type }}
          </p><p class="mt-4 text-sm">
            Instrutor: {{ Array.isArray(course.instructors) ? course.instructors[0]?.name : course.instructors?.name || '—' }}
          </p><p class="mt-2 font-black">
            {{ formatPrice(Number(course.promotional_price ?? course.price)) }}
          </p><div class="mt-5 flex gap-2">
            <AppButton
              :to="`/admin/cursos/${course.id}`"
              variant="secondary"
            >
              Editar
            </AppButton><button
              aria-label="Mais ações"
              class="min-h-11 rounded-xl border border-border px-4"
            >
              •••
            </button>
          </div>
        </article>
      </div>
    </div>
    <div
      v-else
      class="mt-8 rounded-card border border-dashed border-border bg-white p-12 text-center"
    >
      <h2 class="text-xl font-black">
        Nenhum curso cadastrado
      </h2><p class="mt-2 text-muted">
        Crie o primeiro curso do catálogo.
      </p>
    </div>
  </section>
</template>
