import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from '../../app/pages/esqueci-minha-senha.vue'
import RecoveryPasswordPage from '../../app/pages/redefinir-senha.vue'
import { getPasswordRecoveryRedirect } from '../../app/utils/auth-redirect'

const { resetPassword, getSession, onAuthStateChange, unsubscribe } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}))

mockNuxtImport('useAuth', () => () => ({ resetPassword }))
mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { getSession, onAuthStateChange },
}))

describe('password recovery', () => {
  afterEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('renders the forgot-password route and keeps its response enumeration-safe', async () => {
    resetPassword.mockResolvedValue({ data: {}, error: new Error('account not found') })
    const wrapper = await mountSuspended(ForgotPasswordPage)

    expect(wrapper.get('h1').text()).toBe('Esqueci minha senha')
    expect(wrapper.get('button').text()).toBe('Enviar link de recuperação')
    await wrapper.get('input[type="email"]').setValue('aluno@example.test')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Se existir uma conta para esse endereço')
  })

  it('builds a local redirect to the recovery page', () => {
    expect(getPasswordRecoveryRedirect('http://localhost:3000')).toBe('http://localhost:3000/redefinir-senha')
    expect(getPasswordRecoveryRedirect('https://cursos.example/')).toBe('https://cursos.example/redefinir-senha')
  })

  it('shows the form only after a valid PASSWORD_RECOVERY event', async () => {
    let authCallback: ((event: string, session: object | null) => void) | undefined
    onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe } } }
    })
    getSession.mockResolvedValue({ data: { session: { user: { id: 'server-session' } } }, error: null })

    const wrapper = await mountSuspended(RecoveryPasswordPage, {
      global: { stubs: { AccountChangePasswordForm: { template: '<form>Recovery form</form>' } } },
    })
    authCallback?.('PASSWORD_RECOVERY', { user: { id: 'server-session' } })
    await new Promise(resolve => window.setTimeout(resolve, 0))
    await nextTick()

    expect(wrapper.text()).toContain('Recovery form')
  })

  it('shows a safe error for an invalid or expired link and clears its fragment', async () => {
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })
    getSession.mockResolvedValue({ data: { session: null }, error: new Error('invalid token details') })
    window.history.replaceState({}, '', '/redefinir-senha#error=access_denied')

    const wrapper = await mountSuspended(RecoveryPasswordPage)
    await new Promise(resolve => window.setTimeout(resolve, 0))
    await nextTick()

    expect(wrapper.text()).toContain('Este link de recuperação expirou ou não é mais válido.')
    expect(wrapper.text()).not.toContain('invalid token details')
    expect(window.location.hash).toBe('')
  })

  it('does not log authentication fragments', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })
    getSession.mockResolvedValue({ data: { session: null }, error: new Error('invalid') })
    window.history.replaceState({}, '', '/redefinir-senha#access_token=secret&refresh_token=secret')

    await mountSuspended(RecoveryPasswordPage)
    await new Promise(resolve => window.setTimeout(resolve, 0))

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
