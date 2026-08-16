import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildEmailContent } from '../../server/services/notification-provider'

const accountService = readFileSync('server/services/guest-account.service.ts', 'utf8')
const completionService = readFileSync('server/services/complete-order.service.ts', 'utf8')
const authMiddleware = readFileSync('app/middleware/auth.ts', 'utf8')
const loginPage = readFileSync('app/pages/login.vue', 'utf8')
const firstAccessPage = readFileSync('app/pages/primeiro-acesso.vue', 'utf8')
const completionEndpoint = readFileSync('server/api/auth/complete-first-access.post.ts', 'utf8')

describe('student first access', () => {
  it('creates only new student accounts with an initial password and mandatory change marker', () => {
    expect(accountService).toContain('randomBytes(18).toString(\'base64url\')')
    expect(accountService).toContain('admin.auth.admin.createUser')
    expect(accountService).toContain('app_metadata: { role: \'STUDENT\', must_change_password: true }')
    expect(accountService).not.toContain('inviteUserByEmail')
  })

  it('sends the initial credential only through the password setup notification', () => {
    expect(completionService).toContain('provider.sendPasswordSetup')
    expect(completionService).toContain('initialPassword })')
    expect(completionService).toContain('admin.auth.resetPasswordForEmail')
    expect(completionService).toContain('redirectTo: `${notificationConfig.appUrl}/redefinir-senha`')
    expect(completionService).toContain('type: \'PASSWORD_SETUP\'')
  })

  it('emails the login, temporary password and mandatory first-access instruction', () => {
    const content = buildEmailContent('PASSWORD_SETUP', {
      userId: 'student-id', channel: 'EMAIL', destination: 'aluno@example.test', participantName: 'Aluno',
      courseTitle: 'Curso Teste', passwordSetupUrl: 'https://cursos.example/login', initialPassword: 'temporaria-segura',
    })

    expect(content.subject).toContain('Seu acesso inicial')
    expect(content.html).toContain('Login: <strong>aluno@example.test</strong>')
    expect(content.html).toContain('Senha temporária: <strong>temporaria-segura</strong>')
    expect(content.html).toContain('No primeiro acesso, você deverá criar uma nova senha')
  })

  it('forces password replacement before the student panel is opened', () => {
    expect(loginPage).toContain('navigateTo(\'/primeiro-acesso\')')
    expect(authMiddleware).toContain('to.path !== \'/primeiro-acesso\'')
    expect(firstAccessPage).toContain('<AccountChangePasswordForm initial-access />')
    expect(completionEndpoint).toContain('must_change_password: false')
  })
})
