import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('certificates')
    .select('id,certificate_number,verification_code,issued_at,file_path,courses(title)')
    .eq('user_id', user.sub).order('issued_at', { ascending: false })
  if (error) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível consultar seus certificados' }) }
  return await Promise.all((data ?? []).map(async (certificate: { id: string, certificate_number: string, verification_code: string, issued_at: string, file_path: string | null, courses: { title: string } | { title: string }[] | null }) => {
    const course = Array.isArray(certificate.courses) ? certificate.courses[0] : certificate.courses
    let downloadUrl = `/api/student/certificates/${certificate.id}.pdf`
    if (certificate.file_path) {
      const { data: signed } = await admin.storage.from('certificates').createSignedUrl(certificate.file_path, 3600)
      downloadUrl = signed?.signedUrl ?? downloadUrl
    }
    return { id: certificate.id, number: certificate.certificate_number, verificationCode: certificate.verification_code,
      issuedAt: certificate.issued_at, courseTitle: course?.title ?? 'Curso', downloadUrl }
  }))
})
