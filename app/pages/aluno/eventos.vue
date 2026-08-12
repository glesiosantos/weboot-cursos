<script setup lang="ts">
definePageMeta({ layout: 'authenticated', middleware: ['auth', 'student'] })
type StudentEvent = { id: string, courses: { title: string, course_presential_details: { location_name: string, starts_at: string } | null } | null }
const { data: events } = await useFetch<StudentEvent[]>('/api/student/events')
</script>

<template>
  <section>
    <AppBadge>EVENTOS</AppBadge><h1 class="mt-4 text-3xl font-black">
      Minhas credenciais
    </h1><div class="mt-7 grid gap-5 md:grid-cols-2">
      <article
        v-for="item in events"
        :key="item.id"
        class="rounded-card border border-border bg-white p-6"
      >
        <h2 class="text-xl font-extrabold">
          {{ item.courses?.title }}
        </h2><p class="mt-2 text-sm text-muted">
          {{ item.courses?.course_presential_details?.location_name }} · {{ item.courses?.course_presential_details?.starts_at ? formatCourseDate(item.courses.course_presential_details.starts_at) : 'Data a confirmar' }}
        </p><AppButton
          class="mt-5"
          :to="`/aluno/eventos/${item.id}/credencial`"
        >
          Minha credencial
        </AppButton>
      </article><p
        v-if="!events?.length"
        class="text-muted"
      >
        Nenhuma credencial ativa.
      </p>
    </div>
  </section>
</template>
