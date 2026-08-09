import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChangePasswordForm from '../../app/components/account/ChangePasswordForm.vue'
import { changePasswordSchema } from '../../app/utils/password'

const { updatePassword, reauthenticate, signOut, navigateTo } = vi.hoisted(() => ({
  updatePassword: vi.fn(),
  reauthenticate: vi.fn(),
  signOut: vi.fn(),
  navigateTo: vi.fn(),
}))

mockNuxtImport('useAuth', () => () => ({ updatePassword, reauthenticate, signOut }))
mockNuxtImport('navigateTo', () => navigateTo)

const fillValidPassword = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
  const inputs = wrapper.findAll('input')
  await inputs[0]?.setValue('nova-senha-segura')
  await inputs[1]?.setValue('nova-senha-segura')
}

describe('authenticated password change', () => {
  afterEach(() => {
    updatePassword.mockReset()
    reauthenticate.mockReset()
    signOut.mockReset()
    navigateTo.mockReset()
  })

  it('renders the complete form for use on the authenticated page', async () => {
    const wrapper = await mountSuspended(ChangePasswordForm)
    expect(wrapper.get('label[for="new-password"]').text()).toBe('Nova senha')
    expect(wrapper.get('label[for="password-confirmation"]').text()).toBe('Confirmar nova senha')
    expect(wrapper.findAll('input').every(input => input.attributes('autocomplete') === 'new-password')).toBe(true)
  })

  it('rejects a password shorter than eight characters', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'curta', passwordConfirmation: 'curta' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(issue => issue.message.includes('mínimo 8'))).toBe(true)
  })

  it('rejects a different confirmation', () => {
    const result = changePasswordSchema.safeParse({ newPassword: 'senha-segura', passwordConfirmation: 'outra-senha' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(issue => issue.message === 'As senhas não coincidem')).toBe(true)
  })

  it('calls the authenticated update with only the validated password', async () => {
    updatePassword.mockResolvedValue({ error: null, sessionExpired: false })
    const wrapper = await mountSuspended(ChangePasswordForm)
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(updatePassword).toHaveBeenCalledOnce()
    expect(updatePassword).toHaveBeenCalledWith('nova-senha-segura', undefined)
    expect(updatePassword.mock.calls[0]).not.toContain(expect.objectContaining({ user_id: expect.anything() }))
  })

  it('clears both password fields after success', async () => {
    updatePassword.mockResolvedValue({ error: null, sessionExpired: false })
    const wrapper = await mountSuspended(ChangePasswordForm)
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')
    await nextTick()

    expect(wrapper.text()).toContain('Senha alterada com sucesso.')
    expect(wrapper.findAll('input').map(input => input.element.value)).toEqual(['', ''])
  })

  it('shows friendly feedback when Supabase rejects the update', async () => {
    updatePassword.mockResolvedValue({ error: new Error('technical auth error'), sessionExpired: false })
    const wrapper = await mountSuspended(ChangePasswordForm)
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')
    await nextTick()

    expect(wrapper.text()).toContain('Não foi possível alterar sua senha. Tente novamente.')
    expect(wrapper.text()).not.toContain('technical auth error')
  })

  it('redirects an expired session without exposing the password', async () => {
    updatePassword.mockResolvedValue({ error: new Error('session missing'), sessionExpired: true })
    const wrapper = await mountSuspended(ChangePasswordForm)
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(navigateTo).not.toHaveBeenCalledWith(expect.stringContaining('nova-senha-segura'))
  })

  it('ends the recovery session and redirects to login after success', async () => {
    updatePassword.mockResolvedValue({ error: null, sessionExpired: false })
    signOut.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(ChangePasswordForm, { props: { recovery: true } })
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(updatePassword).toHaveBeenCalledWith('nova-senha-segura', undefined)
    expect(signOut).toHaveBeenCalledOnce()
    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(wrapper.text()).toContain('Senha redefinida com sucesso.')
    expect(useState<string>('auth-feedback').value).toBe('Senha alterada. Entre novamente com sua nova senha.')
  })

  it('requests and accepts a reauthentication code when secure password change requires it', async () => {
    updatePassword
      .mockResolvedValueOnce({ error: new Error('reauthentication needed'), sessionExpired: false, reauthenticationNeeded: true })
      .mockResolvedValueOnce({ error: null, sessionExpired: false, reauthenticationNeeded: false })
    reauthenticate.mockResolvedValue({ error: null })
    const wrapper = await mountSuspended(ChangePasswordForm)
    await fillValidPassword(wrapper)
    await wrapper.get('form').trigger('submit')
    await nextTick()

    expect(reauthenticate).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Código de confirmação')
    await wrapper.get('#reauthentication-code').setValue('123456')
    await wrapper.get('form').trigger('submit')

    expect(updatePassword).toHaveBeenLastCalledWith('nova-senha-segura', '123456')
  })
})
