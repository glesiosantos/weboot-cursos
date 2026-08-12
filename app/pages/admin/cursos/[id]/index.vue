<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Editar curso | Administração', robots: 'noindex' })
const route = useRoute(); const id = String(route.params.id)
const { data: course, error } = await useFetch(`/api/admin/courses/${id}`)
if (error.value || !course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
const details = Array.isArray(course.value.course_presential_details) ? course.value.course_presential_details[0] : course.value.course_presential_details
const initial = { ...course.value, batches: (course.value.course_batches ?? []).map(batch => ({ ...batch, starts_at: batch.starts_at?.slice(0, 16) ?? null, ends_at: batch.ends_at?.slice(0, 16) ?? null })), presential: details ? { ...details, starts_at: details.starts_at.slice(0, 16), ends_at: details.ends_at.slice(0, 16), registration_deadline: details.registration_deadline?.slice(0, 16) ?? null } : null }
</script>

<template>
  <section>
    <AppBadge>EDIÇÃO</AppBadge><h1 class="mt-3 text-3xl font-black">
      {{ course?.title }}
    </h1><AdminCourseForm
      :course-id="id"
      :initial="initial"
    />
  </section>
</template>
