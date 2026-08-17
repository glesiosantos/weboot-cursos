<script setup lang="ts">
const route = useRoute()
const { data: registration } = await useFetch<{ status: string, course_title: string, participant_name: string, starts_at: string | null, location_name: string | null }>(`/api/registrations/${encodeURIComponent(String(route.params.reference))}`)
if (!registration.value) { throw createError({ statusCode: 404, statusMessage: 'Inscrição não encontrada' }) }
if (registration.value.status !== 'PAID') { await navigateTo(`/inscricao/retorno?referencia=${encodeURIComponent(String(route.params.reference))}`) }
</script>

<template>
  <main class="page-shell py-16">
    <section
      v-if="registration"
      class="mx-auto max-w-xl rounded-card border border-green-200 bg-white p-8 text-center shadow-soft"
    >
      <div class="text-5xl text-green-600">
        ✓
      </div><h1 class="mt-4 text-3xl font-black">
        Inscrição confirmada
      </h1>
      <dl class="mt-8 space-y-3 text-left">
        <div>
          <dt class="text-sm text-muted">
            Curso
          </dt><dd class="font-bold">
            {{ registration.course_title }}
          </dd>
        </div><div>
          <dt class="text-sm text-muted">
            Participante
          </dt><dd class="font-bold">
            {{ registration.participant_name }}
          </dd>
        </div><div v-if="registration.starts_at">
          <dt class="text-sm text-muted">
            Data
          </dt><dd class="font-bold">
            {{ new Date(registration.starts_at).toLocaleString('pt-BR') }}
          </dd>
        </div><div v-if="registration.location_name">
          <dt class="text-sm text-muted">
            Local
          </dt><dd class="font-bold">
            {{ registration.location_name }}
          </dd>
        </div>
      </dl>
      <p class="mt-8 text-sm text-muted">
        Enviamos as instruções de acesso para seu email. Depois de definir sua senha, a credencial ficará disponível em Meus Eventos.
      </p>
      <AppButton
        to="/login"
        class="mt-6"
      >
        CRIAR ACESSO À PLATAFORMA
      </AppButton>
    </section>
  </main>
</template>
