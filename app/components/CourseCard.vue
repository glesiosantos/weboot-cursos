<script setup lang="ts">
import type { Course } from '~/types/course'

withDefaults(defineProps<{ course: Course, context?: 'public' | 'student', enrolled?: boolean }>(), { context: 'public', enrolled: false })
</script>

<template>
  <article class="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-100 hover:shadow-soft">
    <div class="relative aspect-video overflow-hidden bg-ink">
      <img
        v-if="course.cover_url"
        :src="course.cover_url"
        :alt="`Capa do curso ${course.title}`"
        width="640"
        height="360"
        loading="lazy"
        class="size-full object-cover transition duration-500 group-hover:scale-[1.025]"
      ><div
        v-else
        class="grid size-full place-items-center bg-[linear-gradient(145deg,#0b1633,#1f5eff)] text-5xl font-black text-white/25"
      >
        W
      </div><AppBadge class="absolute left-4 top-4">
        {{ course.course_type }}
      </AppBadge>
    </div><div class="flex flex-1 flex-col p-6">
      <h3 class="text-xl font-extrabold tracking-tight">
        {{ course.title }}
      </h3><AppBadge
        v-if="context === 'student' && enrolled"
        class="mt-2"
      >
        JÁ ADQUIRIDO
      </AppBadge><p class="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
        {{ course.short_description }}
      </p><p class="mt-4 text-sm text-muted">
        Por <b class="text-ink">{{ course.instructor_name || 'Equipe WeBoot' }}</b>
      </p><div class="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted">
        <span>{{ course.workload_hours }}h</span><span v-if="course.course_type === 'ONLINE' && course.module_count !== undefined">{{ course.module_count }} módulos</span><span v-if="course.course_type === 'ONLINE' && course.lesson_count !== undefined">{{ course.lesson_count }} aulas</span><span v-if="course.presential">{{ formatCourseDate(course.presential.starts_at) }}</span><span v-if="course.presential">{{ course.presential.city }}/{{ course.presential.state }}</span>
      </div><div class="mt-auto flex items-end justify-between gap-3 border-t border-border pt-5">
        <div>
          <span
            v-if="course.pricing_type !== 'BATCHES' && course.promotional_price !== null"
            class="block text-xs text-muted line-through"
          >{{ formatPrice(course.price) }}</span><p class="font-extrabold">
            <span
              v-if="course.pricing_type === 'BATCHES' && course.public_price !== null"
              class="block text-xs font-semibold text-muted"
            >A partir de</span>
            {{ course.public_price === null ? 'Lotes indisponíveis' : formatPrice(course.public_price ?? course.promotional_price ?? course.price) }}
          </p><span
            v-if="course.current_batch"
            class="text-xs font-bold text-primary"
          >{{ course.current_batch.name }}</span>
        </div><AppButton
          :to="enrolled ? '/aluno/cursos' : `/cursos/${course.slug}`"
          variant="secondary"
        >
          {{ enrolled ? 'Acessar curso' : 'Ver curso' }}
        </AppButton>
      </div>
    </div>
  </article>
</template>
