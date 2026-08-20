<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: 'WeBoot Cursos | Conhecimento que transforma sua carreira',
  description: 'Cursos práticos, online e presenciais, para aplicar conhecimento no mundo real e transformar sua carreira.',
  ogTitle: 'WeBoot Cursos | Conhecimento que transforma sua carreira',
  ogDescription: 'Aprenda na prática com cursos online e presenciais e certificados verificáveis.',
  ogType: 'website',
})
useHead({ link: [{ rel: 'canonical', href: config.public.appUrl }] })
const { data: courses, pending } = usePublishedCourses()
const featuredCourses = computed(() => (courses.value ?? []).slice(0, 3))
</script>

<template>
  <div>
    <HeroSection /><PlatformBenefits /><FeaturedCourses
      :courses="featuredCourses"
      :loading="pending"
    /><LearningSteps /><CourseModeSection /><StudentExperience /><CertificateSection /><FinalCTA />
  </div>
</template>
