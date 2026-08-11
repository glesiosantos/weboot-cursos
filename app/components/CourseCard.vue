<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{ course: Course }>()
</script>

<template>
  <article class="group overflow-hidden rounded-card border border-border bg-white">
    <div class="relative aspect-[16/10] overflow-hidden bg-ink">
      <img
        v-if="course.cover_url"
        :src="course.cover_url"
        :alt="`Capa do curso ${course.title}`"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
      ><div
        v-else
        class="grid size-full place-items-center bg-[linear-gradient(145deg,#12211b,#08745f)] text-5xl font-black text-white/25"
      >
        W
      </div><AppBadge class="absolute left-4 top-4">
        {{ course.course_type }}
      </AppBadge>
    </div><div class="p-5">
      <h3 class="text-xl font-extrabold tracking-tight">
        {{ course.title }}
      </h3><p class="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
        {{ course.short_description }}
      </p><p class="mt-4 text-sm text-muted">
        Por <b class="text-ink">{{ course.instructor_name || 'Equipe WeBoot' }}</b>
      </p><div class="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted">
        <span>{{ course.workload_hours }}h</span><span v-if="course.presential">{{ formatCourseDate(course.presential.starts_at) }}</span><span v-if="course.presential">{{ course.presential.city }}/{{ course.presential.state }}</span>
      </div><div class="mt-5 flex items-center justify-between border-t border-border pt-4">
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
          </p>
        </div><AppButton
          :to="`/cursos/${course.slug}`"
          variant="secondary"
        >
          Ver curso
        </AppButton>
      </div>
    </div>
  </article>
</template>
