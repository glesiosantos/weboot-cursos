import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireCourseManager } from '../../../../../../utils/auth'
import { maskDestination, RoutedNotificationProvider } from '../../../../../../services/notification-provider'

const schema = z.object({ type: z.enum(['ENROLLMENT_CONFIRMATION', 'EVENT_CREDENTIAL', 'PASSWORD_SETUP']) }).strict()

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, 'id') || ''
  const enrollmentId = getRouterParam(event, 'enrollmentId') || ''
  await requireCourseManager(event, courseId)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) { throw createError({ statusCode: 400, statusMessage: 'Tipo de notificação inválido' }) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const { data, error } = await admin.from('enrollments')
    .select('id,user_id,orders(registration_id),profiles(name),courses(title,course_presential_details(starts_at,location_name)),event_credentials(status)')
    .eq('id', enrollmentId).eq('course_id', courseId).single()
  const registrationId = data?.orders?.registration_id
  if (error || !data || !registrationId) { throw createError({ statusCode: 404, statusMessage: 'Inscrição pública não encontrada' }) }
  const { data: registration } = await admin.from('registration_contacts').select('email,whatsapp').eq('id', registrationId).single()
  if (!registration) { throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' }) }
  const config = useRuntimeConfig(event)
  const provider = new RoutedNotificationProvider(String(config.notificationWebhookUrl || ''), String(config.notificationWebhookToken || ''), {
    host: String(config.smtpHost || ''), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure),
    user: String(config.smtpUser || ''), password: String(config.smtpPassword || ''), from: String(config.smtpFrom || ''),
  })
  const details = Array.isArray(data.courses?.course_presential_details) ? data.courses.course_presential_details[0] : data.courses?.course_presential_details
  const sentChannels: string[] = []
  const skippedChannels: string[] = []
  if (body.data.type === 'PASSWORD_SETUP') {
    const initialPassword = randomBytes(18).toString('base64url')
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(data.user_id)
    if (authError || !authData.user) { throw createError({ statusCode: 500, statusMessage: 'Conta do aluno não encontrada' }) }
    const { error: updateError } = await admin.auth.admin.updateUserById(data.user_id, {
      password: initialPassword,
      app_metadata: { ...authData.user.app_metadata, role: 'STUDENT', must_change_password: true },
    })
    if (updateError) { throw createError({ statusCode: 500, statusMessage: 'Não foi possível gerar uma nova senha temporária' }) }
    const sent = await provider.sendPasswordSetup({
      userId: data.user_id, registrationId, channel: 'EMAIL', destination: registration.email,
      participantName: data.profiles?.name ?? 'Aluno', courseTitle: data.courses?.title ?? 'Curso',
      passwordSetupUrl: `${String(config.public.appUrl).replace(/\/$/, '')}/login`, initialPassword,
    })
    const { error: logError } = await admin.from('notification_logs').insert({
      user_id: data.user_id, registration_id: registrationId, channel: 'EMAIL', type: body.data.type,
      destination_masked: maskDestination('EMAIL', registration.email), status: sent.skipped ? 'SKIPPED' : 'SENT', external_id: sent.id,
      sent_at: sent.skipped ? null : new Date().toISOString(),
    })
    if (logError) { throw createError({ statusCode: 500, statusMessage: 'O primeiro acesso foi processado, mas o resultado não pôde ser registrado' }) }
    if (sent.skipped) { throw createError({ statusCode: 503, statusMessage: 'O envio de e-mail não está configurado' }) }
    return { sent: true, sentChannels: ['EMAIL'], skippedChannels: [] }
  }
  for (const channel of ['EMAIL', 'WHATSAPP'] as const) {
    const destination = channel === 'EMAIL' ? registration.email : registration.whatsapp
    const input = { userId: data.user_id, registrationId, channel, destination, participantName: data.profiles?.name ?? 'Aluno',
      courseTitle: data.courses?.title ?? 'Curso', startsAt: details?.starts_at, location: details?.location_name,
      credentialUrl: `${String(config.public.appUrl).replace(/\/$/, '')}/aluno/eventos` }
    const sent = body.data.type === 'EVENT_CREDENTIAL' ? await provider.sendEventCredential(input) : await provider.sendEnrollmentConfirmation(input)
    const { error: logError } = await admin.from('notification_logs').insert({ user_id: data.user_id, registration_id: registrationId, channel, type: body.data.type,
      destination_masked: maskDestination(channel, destination), status: sent.skipped ? 'SKIPPED' : 'SENT', external_id: sent.id,
      sent_at: sent.skipped ? null : new Date().toISOString() })
    if (logError) { throw createError({ statusCode: 500, statusMessage: 'A notificação foi processada, mas o resultado não pôde ser registrado' }) }
    if (sent.skipped) { skippedChannels.push(channel) }
    else { sentChannels.push(channel) }
  }
  if (!sentChannels.length) {
    throw createError({ statusCode: 503, statusMessage: 'Nenhum canal de notificação está configurado' })
  }
  return { sent: true, sentChannels, skippedChannels }
})
