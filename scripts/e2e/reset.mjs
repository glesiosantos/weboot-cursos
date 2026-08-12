import { assertNoError, loadE2EEnvironment, serviceClient } from './helpers.mjs'

const { url, secret, host } = loadE2EEnvironment()
const client = serviceClient(url, secret)
const slug = process.env.E2E_COURSE_SLUG || 'e2e-course-catalog-test'
const course = assertNoError(await client.from('courses').select('id,folder_path').eq('slug', slug).maybeSingle(), 'Busca do curso E2E')
if (!course) { throw new Error('Fixture do curso E2E não encontrada; execute npm run e2e:bootstrap') }
if (course.folder_path) { assertNoError(await client.storage.from('course-public-assets').remove([course.folder_path]), 'Remoção do folder E2E') }
assertNoError(await client.from('courses').update({ status: 'DRAFT', published_at: null, folder_path: null, folder_mime_type: null, folder_alt_text: null }).eq('id', course.id), 'Reset do curso E2E para DRAFT')
console.warn(`Fixture E2E restaurada para DRAFT no Supabase DEV (${host}).`)
