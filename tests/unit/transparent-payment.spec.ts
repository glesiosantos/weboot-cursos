import { describe, expect, it, vi } from 'vitest'
import { paymentPrice } from '../../server/utils/payment-pricing'
import { protectRegistration, revealRegistrationCpf } from '../../server/utils/registration'
import { readFileSync } from 'node:fs'

vi.stubGlobal('createError', (value: unknown) => value)

const config = {
  asaasPixPercent: 0,
  asaasPixFixed: 0,
  asaasCardCashPercent: 0,
  asaasCardInstallmentPercent: 2.49,
  asaasCardFixed: 5.49,
  paymentServiceFee: 0,
}

describe('transparent payment', () => {
  it('automatically restores an open Pix without showing the generation form', () => {
    const page = readFileSync('app/pages/pagamento/[reference].vue', 'utf8')
    const endpoint = readFileSync('server/api/payments/[reference].get.ts', 'utf8')
    expect(endpoint).toContain('has_open_pix:')
    expect(page).toContain('if (checkout.value?.has_open_pix) { void pay() }')
    expect(page).toContain('!checkout?.has_open_pix')
  })
  it('keeps address fields out of the form and sends fixed provider values from the server', () => {
    const page = readFileSync('app/pages/pagamento/[reference].vue', 'utf8')
    const endpoint = readFileSync('server/api/payments/[reference]/card.post.ts', 'utf8')
    expect(page).not.toContain('CEP do titular')
    expect(page).not.toContain('Número do endereço')
    expect(page).not.toContain('postal_code')
    expect(page).not.toContain('address_number')
    expect(endpoint).not.toContain('postal_code: z.string()')
    expect(endpoint).not.toContain('address_number: z.string()')
    expect(endpoint).toContain('postalCode: \'64000000\', addressNumber: \'10\'')
  })
  it('refreshes the order until payment is confirmed and presents first-access instructions', () => {
    const page = readFileSync('app/pages/pagamento/[reference].vue', 'utf8')
    expect(page).toContain('`/api/payments/${reference}/sync`')
    expect(page).toContain('setInterval(() => { void refreshPaymentStatus() }, 5000)')
    expect(page).toContain('checkout.value?.status === \'PAID\'')
    expect(page).toContain('Pagamento realizado com sucesso!')
    expect(page).toContain('instruções de primeiro acesso')
    expect(page).toContain('clearInterval(paymentStatusTimer)')
  })
  it('charges exactly the course or batch price on Pix', () => {
    expect(paymentPrice(100, 'PIX', 1, config)).toEqual({
      base: 100, providerFee: 0, serviceFee: 0, total: 100, percent: 0, installments: 1,
    })
  })

  it('charges no fee in cash and R$ 5.49 plus 2.49% from 2 to 6 installments', () => {
    expect(paymentPrice(100, 'CREDIT_CARD', 1, config).total).toBe(100)
    expect(paymentPrice(100, 'CREDIT_CARD', 2, config).total).toBe(107.98)
    expect(paymentPrice(100, 'CREDIT_CARD', 6, config).total).toBe(107.98)
  })

  it('can recover the CPF only on the server with the encryption key', () => {
    const key = 'a'.repeat(32)
    const protectedCpf = protectRegistration('52998224725', key)
    expect(protectedCpf.cpfEncrypted).not.toContain('52998224725')
    expect(revealRegistrationCpf(protectedCpf.cpfEncrypted, key)).toBe('52998224725')
  })
})
