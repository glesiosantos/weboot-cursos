import nodemailer from 'nodemailer'

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

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  from: string
}

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[character] ?? character))

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value))
  : undefined

export const buildEmailContent = (type: string, input: EnrollmentNotification) => {
  const name = escapeHtml(input.participantName)
  const course = escapeHtml(input.courseTitle)
  const details = [formatDate(input.startsAt), input.location].filter(Boolean).map(value => `<p>${escapeHtml(String(value))}</p>`).join('')
  if (type === 'PASSWORD_SETUP') {
    return { subject: `Seu acesso inicial — ${input.courseTitle}`, html: `<p>Olá, ${name}.</p><p>Seu acesso ao curso <strong>${course}</strong> foi criado.</p><p>Login: <strong>${escapeHtml(input.destination)}</strong></p>${input.initialPassword ? `<p>Senha temporária: <strong>${escapeHtml(input.initialPassword)}</strong></p>` : ''}<p><a href="${escapeHtml(input.passwordSetupUrl ?? '')}">Entrar na plataforma</a></p><p>No primeiro acesso, você deverá criar uma nova senha antes de acessar a área do aluno.</p>` }
  }
  if (type === 'EVENT_CREDENTIAL') {
    return { subject: `Credencial — ${input.courseTitle}`, html: `<p>Olá, ${name}.</p><p>Sua credencial para <strong>${course}</strong> está disponível.</p>${details}<p><a href="${escapeHtml(input.credentialUrl ?? '')}">Ver credencial</a></p>` }
  }
  return { subject: `Inscrição confirmada — ${input.courseTitle}`, html: `<p>Olá, ${name}.</p><p>Sua inscrição em <strong>${course}</strong> foi confirmada.</p>${details}${input.credentialUrl ? `<p><a href="${escapeHtml(input.credentialUrl)}">Acessar meus eventos</a></p>` : ''}` }
}

export class SmtpNotificationProvider implements NotificationProvider {
  private readonly transporter

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure,
      requireTLS: !config.secure,
      auth: { user: config.user, pass: config.password },
    })
  }

  private async send(type: string, input: EnrollmentNotification) {
    if (input.channel !== 'EMAIL') { return { skipped: true } }
    const content = buildEmailContent(type, input)
    const result = await this.transporter.sendMail({ from: this.config.from || this.config.user, to: input.destination, ...content })
    return { id: result.messageId }
  }

  sendEnrollmentConfirmation(input: EnrollmentNotification) { return this.send('ENROLLMENT_CONFIRMATION', input) }
  sendEventCredential(input: EnrollmentNotification) { return this.send('EVENT_CREDENTIAL', input) }
  sendPasswordSetup(input: EnrollmentNotification) { return this.send('PASSWORD_SETUP', input) }
}

export class RoutedNotificationProvider implements NotificationProvider {
  private readonly webhook: WebhookNotificationProvider
  private readonly smtp?: SmtpNotificationProvider

  constructor(webhookUrl: string, webhookToken: string, smtpConfig?: SmtpConfig) {
    this.webhook = new WebhookNotificationProvider(webhookUrl, webhookToken)
    if (smtpConfig?.host && smtpConfig.user && smtpConfig.password) { this.smtp = new SmtpNotificationProvider(smtpConfig) }
  }

  private provider(input: EnrollmentNotification) { return input.channel === 'EMAIL' && this.smtp ? this.smtp : this.webhook }
  sendEnrollmentConfirmation(input: EnrollmentNotification) { return this.provider(input).sendEnrollmentConfirmation(input) }
  sendEventCredential(input: EnrollmentNotification) { return this.provider(input).sendEventCredential(input) }
  sendPasswordSetup(input: EnrollmentNotification) { return this.provider(input).sendPasswordSetup(input) }
}

export const maskDestination = (channel: NotificationChannel, value: string) => {
  if (channel === 'EMAIL') {
    const [name, domain] = value.split('@')
    return `${name?.slice(0, 2) ?? '**'}***@${domain ?? '***'}`
  }
  return `${value.slice(0, 3)}******${value.slice(-2)}`
}
