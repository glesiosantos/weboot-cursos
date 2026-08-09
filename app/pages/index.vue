<script setup lang="ts">
useSeoMeta({ title: 'Weboot Cursos', description: 'Cursos online e presenciais para acelerar sua carreira.' })
const { data: courses, pending } = usePublishedCourses()
</script>

<template>
  <div>
    <HeroSection /><PlatformBenefits /><FeaturedCourses
      :courses="courses ?? []"
      :loading="pending"
    /><LearningSteps /><CourseModeSection /><StudentExperience /><CertificateSection /><FinalCTA />
  </div>
</template>
