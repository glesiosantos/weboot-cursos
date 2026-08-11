<script setup lang="ts">
import type { Course } from '~/types/course'
import CoursePresentation from '~/components/course/CoursePresentation.vue'

const route = useRoute()
const config = useRuntimeConfig()
const { data: course } = await useFetch<Course>(`/api/courses/${encodeURIComponent(String(route.params.slug))}`)
if (!course.value) { throw createError({ statusCode: 404, statusMessage: 'Curso não encontrado' }) }
const canonical = computed(() => `${config.public.appUrl}/cursos/${course.value?.slug}`)
useSeoMeta({ title: () => `${course.value?.title} | WeBoot Cursos`, description: () => course.value?.short_description, ogTitle: () => course.value?.title, ogDescription: () => course.value?.short_description, ogImage: () => course.value?.cover_url ?? undefined })
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <CoursePresentation
    v-if="course"
    :course="course"
    class="page-shell"
  />
</template>
