export type NotificationChannel = 'EMAIL' | 'WHATSAPP'
export type EnrollmentNotification = {
  userId: string
  registrationId?: string | null
  channel: NotificationChannel
  destination: string
  participantName: string
  courseTitle: string
  startsAt?: string | null
  location?: string | null
  credentialUrl?: string | null
  passwordSetupUrl?: string | null
  initialPassword?: string
}

export interface NotificationProvider {
  sendEnrollmentConfirmation(input: EnrollmentNotification): Promise<{ id?: string, skipped?: boolean }>
  sendEventCredential(input: EnrollmentNotification): Promise<{ id?: string, skipped?: boolean }>
  sendPasswordSetup(input: EnrollmentNotification): Promise<{ id?: string, skipped?: boolean }>
}

export class WebhookNotificationProvider implements NotificationProvider {
  constructor(private readonly url: string, private readonly token: string) {}

  private async send(type: string, input: EnrollmentNotification) {
    if (!this.url) { return { skipped: true } }
    const result = await $fetch<{ id?: string }>(this.url, {
      method: 'POST', headers: this.token ? { authorization: `Bearer ${this.token}` } : undefined,
      body: { type, channel: input.channel, destination: input.destination, participantName: input.participantName,
        courseTitle: input.courseTitle, startsAt: input.startsAt, location: input.location,
        credentialUrl: input.credentialUrl, passwordSetupUrl: input.passwordSetupUrl,
        initialPassword: input.initialPassword },
    })
    return { id: result.id }
  }

  sendEnrollmentConfirmation(input: EnrollmentNotification) { return this.send('ENROLLMENT_CONFIRMATION', input) }
  sendEventCredential(input: EnrollmentNotification) { return this.send('EVENT_CREDENTIAL', input) }
  sendPasswordSetup(input: EnrollmentNotification) { return this.send('PASSWORD_SETUP', input) }
}

export const maskDestination = (channel: NotificationChannel, value: string) => {
  if (channel === 'EMAIL') {
    const [name, domain] = value.split('@')
    return `${name?.slice(0, 2) ?? '**'}***@${domain ?? '***'}`
  }
  return `${value.slice(0, 3)}******${value.slice(-2)}`
}
