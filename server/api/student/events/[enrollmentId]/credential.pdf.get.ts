import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const enrollmentId = getRouterParam(event, 'enrollmentId') || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('enrollments')
    .select('id,status,profiles(name),courses(title,course_presential_details(location_name,address,address_number,city,state,starts_at,ends_at)),event_credentials(code,status)')
    .eq('id', enrollmentId).eq('user_id', user.sub).eq('status', 'ACTIVE').single()
  const credential = data?.event_credentials?.[0]
  if (error || !data || !credential || credential.status === 'CANCELED') { throw createError({ statusCode: 404, statusMessage: 'Credencial não encontrada' }) }
  const details = Array.isArray(data.courses?.course_presential_details) ? data.courses.course_presential_details[0] : data.courses?.course_presential_details
  const config = useRuntimeConfig(event)
  const qr = await QRCode.toBuffer(`${String(config.public.appUrl).replace(/\/$/, '')}/checkin/${credential.code}`, { width: 360, margin: 2 })
  const chunks: Buffer[] = []
  const document = new PDFDocument({ size: 'A4', margin: 56, info: { Title: 'Comprovante de inscrição' } })
  document.on('data', chunk => chunks.push(Buffer.from(chunk)))
  const completed = new Promise<Buffer>((resolve, reject) => { document.on('end', () => resolve(Buffer.concat(chunks))); document.on('error', reject) })
  document.fillColor('#162033').fontSize(22).font('Helvetica-Bold').text('WEBOOT')
  document.moveDown().fontSize(18).text('COMPROVANTE DE INSCRIÇÃO', { align: 'center' })
  document.moveDown(1.5).fontSize(11).font('Helvetica').text(`Participante: ${data.profiles?.name ?? 'Aluno'}`)
  document.text(`Curso/evento: ${data.courses?.title ?? ''}`)
  if (details?.starts_at) { document.text(`Data e horário: ${new Date(details.starts_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`) }
  if (details?.location_name) { document.text(`Local: ${details.location_name}`) }
  document.moveDown().image(qr, { fit: [220, 220], align: 'center' })
  document.font('Courier').fontSize(12).text(`Código: ${credential.code}`, { align: 'center' })
  document.moveDown().font('Helvetica').fontSize(9).fillColor('#52606d').text('Apresente este QR Code na entrada. O código é pessoal, revogável e válido para um único check-in.', { align: 'center' })
  document.end()
  const pdf = await completed
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', 'inline; filename="comprovante-inscricao.pdf"')
  setHeader(event, 'cache-control', 'private, no-store')
  return pdf
})
