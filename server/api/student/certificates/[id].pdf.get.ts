import PDFDocument from 'pdfkit'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const certificateId = getRouterParam(event, 'id') || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('certificates')
    .select('id,certificate_number,verification_code,issued_at,profiles(name),courses(title)')
    .eq('id', certificateId).eq('user_id', user.sub).single()
  if (error || !data) { throw createError({ statusCode: 404, statusMessage: 'Certificado não encontrado' }) }
  const student = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  const course = Array.isArray(data.courses) ? data.courses[0] : data.courses
  const chunks: Buffer[] = []
  const document = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 56, info: { Title: 'Certificado de conclusão' } })
  document.on('data', chunk => chunks.push(Buffer.from(chunk)))
  const completed = new Promise<Buffer>((resolve, reject) => { document.on('end', () => resolve(Buffer.concat(chunks))); document.on('error', reject) })
  document.rect(28, 28, 786, 539).lineWidth(3).strokeColor('#155e75').stroke()
  document.fillColor('#155e75').font('Helvetica-Bold').fontSize(18).text('WEBOOT CURSOS', { align: 'center' })
  document.moveDown(2).fillColor('#162033').fontSize(30).text('CERTIFICADO DE CONCLUSÃO', { align: 'center' })
  document.moveDown(1.5).font('Helvetica').fontSize(16).text('Certificamos que', { align: 'center' })
  document.moveDown(0.8).font('Helvetica-Bold').fontSize(27).text(student?.name ?? 'Aluno', { align: 'center' })
  document.moveDown(0.8).font('Helvetica').fontSize(16).text('concluiu o curso', { align: 'center' })
  document.moveDown(0.6).font('Helvetica-Bold').fontSize(22).text(course?.title ?? 'Curso', { align: 'center' })
  document.moveDown(1.5).font('Helvetica').fontSize(12).text(`Emitido em ${new Date(data.issued_at).toLocaleDateString('pt-BR')}`, { align: 'center' })
  document.moveDown(1).fontSize(10).fillColor('#52606d').text(`Certificado nº ${data.certificate_number} | Código de validação ${data.verification_code}`, { align: 'center' })
  document.end()
  const pdf = await completed
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `inline; filename="certificado-${data.certificate_number}.pdf"`)
  setHeader(event, 'cache-control', 'private, no-store')
  return pdf
})
