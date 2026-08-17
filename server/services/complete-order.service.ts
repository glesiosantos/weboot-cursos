import { createCredential, sha256 } from '../utils/commercial'
import { ensureStudentAccount } from './guest-account.service'
import { maskDestination, RoutedNotificationProvider, type SmtpConfig } from './notification-provider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

export const completeCommercialOrder = async (admin: AdminClient, orderId: string, externalPaymentId: string, paymentStatus: string, notificationConfig?: { url: string, token: string, appUrl: string, smtp?: SmtpConfig }) => {
  const { data: order, error: orderError } = await admin.from('orders').select('id,user_id,registration_id,status,course_id,courses(title,course_presential_details(starts_at,location_name))').eq('id', orderId).single()
  if (orderError || !order) { throw orderError ?? new Error('Pedido não encontrado') }
  if (order.status === 'PAID') { return { duplicate: true } }
  let passwordSetupSent = false
  let initialPassword: string | undefined
  let associatedUserId = order.user_id as string | null
  if (!order.user_id && order.registration_id) {
    const { data: registration, error } = await admin.from('registration_contacts')
      .select('full_name,email,whatsapp').eq('id', order.registration_id).single()
    if (error || !registration) { throw error ?? new Error('Participante não encontrado') }
    const account = await ensureStudentAccount(admin, registration)
    associatedUserId = account.userId
    passwordSetupSent = account.passwordSetupSent
    initialPassword = account.initialPassword
    const { error: associateError } = await admin.rpc('associate_guest_order', { target_order_id: orderId, target_user_id: account.userId })
    if (associateError) { throw associateError }
  }
  const credential = createCredential()
  const { data, error } = await admin.rpc('confirm_commercial_payment', {
    target_order_id: orderId, external_payment_id: externalPaymentId, payment_status: paymentStatus,
    credential_code: credential.code, credential_token_hash: sha256(credential.token),
  })
  if (error) { throw error }
  if (order.registration_id && notificationConfig) {
    const { data: registration } = await admin.from('registration_contacts').select('full_name,email,whatsapp').eq('id', order.registration_id).single()
    if (registration) {
      const provider = new RoutedNotificationProvider(notificationConfig.url, notificationConfig.token, notificationConfig.smtp)
      const details = Array.isArray(order.courses?.course_presential_details) ? order.courses.course_presential_details[0] : order.courses?.course_presential_details
      if (initialPassword) {
        try {
          let sent: { id?: string, skipped?: boolean }
          if (notificationConfig.url || notificationConfig.smtp?.password) {
            sent = await provider.sendPasswordSetup({ userId: associatedUserId!, registrationId: order.registration_id, channel: 'EMAIL',
              destination: registration.email, participantName: registration.full_name, courseTitle: order.courses?.title ?? 'Curso',
              passwordSetupUrl: `${notificationConfig.appUrl}/login`, initialPassword })
          }
          else {
            const { error: recoveryError } = await admin.auth.resetPasswordForEmail(registration.email, {
              redirectTo: `${notificationConfig.appUrl}/redefinir-senha`,
            })
            if (recoveryError) { throw recoveryError }
            sent = { id: 'supabase-auth' }
          }
          await admin.from('notification_logs').insert({ user_id: associatedUserId, registration_id: order.registration_id, channel: 'EMAIL',
            type: 'PASSWORD_SETUP', destination_masked: maskDestination('EMAIL', registration.email), status: sent.skipped ? 'SKIPPED' : 'SENT',
            external_id: sent.id, sent_at: sent.skipped ? null : new Date().toISOString() })
        }
        catch {
          await admin.from('notification_logs').insert({ user_id: associatedUserId, registration_id: order.registration_id, channel: 'EMAIL',
            type: 'PASSWORD_SETUP', destination_masked: maskDestination('EMAIL', registration.email), status: 'FAILED' })
        }
      }
      for (const channel of ['EMAIL', 'WHATSAPP'] as const) {
        const destination = channel === 'EMAIL' ? registration.email : registration.whatsapp
        try {
          const sent = await provider.sendEnrollmentConfirmation({ userId: associatedUserId!, registrationId: order.registration_id, channel, destination,
            participantName: registration.full_name, courseTitle: order.courses?.title ?? 'Curso', startsAt: details?.starts_at,
            location: details?.location_name, credentialUrl: `${notificationConfig.appUrl}/aluno/eventos` })
          await admin.from('notification_logs').insert({ user_id: associatedUserId, registration_id: order.registration_id, channel,
            type: 'ENROLLMENT_CONFIRMATION', destination_masked: maskDestination(channel, destination), status: sent.skipped ? 'SKIPPED' : 'SENT',
            external_id: sent.id, sent_at: sent.skipped ? null : new Date().toISOString() })
        }
        catch {
          await admin.from('notification_logs').insert({ user_id: associatedUserId, registration_id: order.registration_id, channel,
            type: 'ENROLLMENT_CONFIRMATION', destination_masked: maskDestination(channel, destination), status: 'FAILED' })
        }
      }
    }
  }
  return { enrollmentId: data, passwordSetupSent, duplicate: false }
}
