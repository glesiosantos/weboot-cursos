<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type StudentCourse = { id: string, courses: { title: string, slug: string, short_description: string, course_type: string, cover_path: string | null } | null }
const { data: enrollments } = await useFetch<StudentCourse[]>('/api/student/courses')
const client = useSupabaseClient()
const coverUrl = (path: string | null | undefined) => path ? client.storage.from('course-covers').getPublicUrl(path).data.publicUrl : null
</script>

<template>
  <section>
    <AppBadge>MEUS CURSOS</AppBadge><h1 class="mt-4 text-3xl font-black">
      Cursos adquiridos
    </h1><div class="mt-7 grid gap-5 md:grid-cols-2">
      <article
        v-for="item in enrollments"
        :key="item.id"
        class="overflow-hidden rounded-card border border-border bg-white"
      >
        <div class="aspect-[16/8] bg-primary-50">
          <img
            v-if="coverUrl(item.courses?.cover_path)"
            :src="coverUrl(item.courses?.cover_path) ?? undefined"
            :alt="`Capa do curso ${item.courses?.title}`"
            class="h-full w-full object-cover"
          ><div
            v-else
            class="flex h-full items-center justify-center text-sm font-bold text-primary-700"
          >
            WEBOOT CURSOS
          </div>
        </div><div class="p-6">
          <AppBadge>{{ item.courses?.course_type }}</AppBadge><h2 class="mt-3 text-xl font-extrabold">
            {{ item.courses?.title }}
          </h2><p class="mt-2 text-sm text-muted">
            {{ item.courses?.short_description }}
          </p><AppButton
            class="mt-5"
            :to="`/aluno/cursos/${item.id}`"
          >
            Acessar curso
          </AppButton>
        </div>
      </article><p
        v-if="!enrollments?.length"
        class="text-muted"
      >
        Você ainda não possui cursos ativos.
      </p>
    </div>
  </section>
</template>
