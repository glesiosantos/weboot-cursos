import { randomBytes } from 'node:crypto'
import { chmodSync, writeFileSync } from 'node:fs'
import { assertNoError, ensureUser, executeDevManagementSql, loadE2EEnvironment, serviceClient } from './helpers.mjs'

const ADMIN_EMAIL = 'e2e.admin@weboot.local'
const STUDENT_EMAIL = 'e2e.student@weboot.local'
const COURSE_SLUG = 'e2e-course-catalog-test'
const COURSE_TITLE = 'E2E Course Catalog Test'

const generatedPassword = () => `${randomBytes(24).toString('base64url')}!aA9`
const { url, secret, host } = loadE2EEnvironment()
const client = serviceClient(url, secret)
const adminPassword = process.env.E2E_ADMIN_PASSWORD || generatedPassword()
const studentPassword = process.env.E2E_STUDENT_PASSWORD || generatedPassword()

const admin = await ensureUser(client, ADMIN_EMAIL, adminPassword, 'ADMIN E2E')
const student = await ensureUser(client, STUDENT_EMAIL, studentPassword, 'STUDENT E2E')

await executeDevManagementSql(host, `
  begin;
  set local session_replication_role = replica;
  update public.profiles p
     set name = case u.email
       when 'e2e.admin@weboot.local' then 'ADMIN E2E'
       else 'STUDENT E2E'
     end,
         role = case u.email
       when 'e2e.admin@weboot.local' then 'ADMIN'::public.user_role
       else 'STUDENT'::public.user_role
     end
    from auth.users u
   where p.id = u.id
     and u.id in ('${admin.id}'::uuid, '${student.id}'::uuid)
     and lower(u.email) in ('e2e.admin@weboot.local', 'e2e.student@weboot.local');
  commit;
`)

let instructor = assertNoError(await client.from('instructors').select('id').eq('name', 'Instrutor E2E').maybeSingle(), 'Busca do instrutor E2E')
if (!instructor) {
  instructor = assertNoError(await client.from('instructors').insert({ name: 'Instrutor E2E', bio: 'Fixture exclusiva para testes E2E.', active: true }).select('id').single(), 'Criação do instrutor E2E')
}
else {
  assertNoError(await client.from('instructors').update({ bio: 'Fixture exclusiva para testes E2E.', active: true }).eq('id', instructor.id), 'Atualização do instrutor E2E')
}

const coursePayload = {
  instructor_id: instructor.id,
  title: COURSE_TITLE,
  slug: COURSE_SLUG,
  short_description: 'Curso isolado para validação automatizada do catálogo.',
  description: 'Descrição pública e segura da fixture E2E do catálogo de cursos.',
  course_type: 'ONLINE',
  workload_hours: 1,
  price: 0,
  promotional_price: null,
  pricing_type: 'BATCHES',
  show_future_batches: true,
  status: 'DRAFT',
  published_at: null,
  archived_at: null,
  program: 'Módulo E2E e Aula E2E',
  requirements: 'Nenhum dado real é necessário.',
  target_audience: 'Execução automatizada E2E.',
  folder_alt_text: null,
  folder_path: null,
  folder_mime_type: null,
}
let course = assertNoError(await client.from('courses').select('id').eq('slug', COURSE_SLUG).maybeSingle(), 'Busca do curso E2E')
if (course) {
  assertNoError(await client.from('courses').update(coursePayload).eq('id', course.id), 'Reset do curso E2E')
}
else {
  course = assertNoError(await client.from('courses').insert(coursePayload).select('id').single(), 'Criação do curso E2E')
}

let module = assertNoError(await client.from('course_modules').select('id').eq('course_id', course.id).eq('position', 0).maybeSingle(), 'Busca do módulo E2E')
if (!module) {
  module = assertNoError(await client.from('course_modules').insert({ course_id: course.id, title: 'Módulo E2E', description: 'Conteúdo seguro de teste.', position: 0 }).select('id').single(), 'Criação do módulo E2E')
}
else {
  assertNoError(await client.from('course_modules').update({ title: 'Módulo E2E', description: 'Conteúdo seguro de teste.' }).eq('id', module.id), 'Atualização do módulo E2E')
}
assertNoError(await client.from('lessons').upsert({
  module_id: module.id,
  title: 'Aula E2E',
  description: 'Aula sem mídia ou conteúdo privado real.',
  lesson_type: 'TEXT',
  content: 'Conteúdo textual exclusivo para automação E2E.',
  video_path: null,
  duration_minutes: 5,
  position: 0,
  is_required: true,
  is_preview: true,
}, { onConflict: 'module_id,position' }), 'Garantia da aula E2E')

assertNoError(await client.from('course_batches').delete().eq('course_id', course.id), 'Reset dos lotes E2E')
assertNoError(await client.from('course_batches').insert({
  course_id: course.id,
  name: 'Lote E2E 1',
  position: 1,
  price: 149.9,
  max_sales: 100,
  starts_at: null,
  ends_at: null,
  status: 'ACTIVE',
  activation_mode: 'QUANTITY',
}), 'Criação do lote E2E')

const contents = [
  '# Gerado por npm run e2e:bootstrap. Nao versionar.',
  `E2E_ADMIN_EMAIL=${ADMIN_EMAIL}`,
  `E2E_ADMIN_PASSWORD=${adminPassword}`,
  `E2E_STUDENT_EMAIL=${STUDENT_EMAIL}`,
  `E2E_STUDENT_PASSWORD=${studentPassword}`,
  `E2E_COURSE_ID=${course.id}`,
  `E2E_COURSE_SLUG=${COURSE_SLUG}`,
  `E2E_COURSE_TITLE=${COURSE_TITLE}`,
  `E2E_INSTRUCTOR_ID=${instructor.id}`,
  `NUXT_PUBLIC_SUPABASE_URL=${url}`,
  `NUXT_PUBLIC_SUPABASE_KEY=${process.env.NUXT_PUBLIC_SUPABASE_KEY ?? ''}`,
  '',
].join('\n')
writeFileSync('.env.e2e.local', contents, { mode: 0o600 })
chmodSync('.env.e2e.local', 0o600)
console.warn(`Fixtures E2E garantidas no Supabase DEV (${host}); credenciais salvas somente em .env.e2e.local.`)
