import { describe, expect, it, vi } from 'vitest'
import { paymentPrice } from '../../server/utils/payment-pricing'
import { protectRegistration, revealRegistrationCpf } from '../../server/utils/registration'

vi.stubGlobal('createError', (value: unknown) => value)

const config = {
  asaasPixPercent: 0,
  asaasPixFixed: 1.99,
  asaasCardCashPercent: 2.99,
  asaasCardInstallmentPercent: 3.49,
  asaasCardFixed: 0.49,
  paymentServiceFee: 5,
}

describe('transparent payment', () => {
  it('adds the configured Pix fee and R$ 5 service fee on the server', () => {
    expect(paymentPrice(100, 'PIX', 1, config)).toEqual({
      base: 100, providerFee: 1.99, serviceFee: 5, total: 106.99, percent: 0, installments: 1,
    })
  })

  it('uses the installment rate only from 2 to 6 installments', () => {
    expect(paymentPrice(100, 'CREDIT_CARD', 1, config).total).toBe(108.48)
    expect(paymentPrice(100, 'CREDIT_CARD', 6, config).total).toBe(108.98)
  })

  it('can recover the CPF only on the server with the encryption key', () => {
    const key = 'a'.repeat(32)
    const protectedCpf = protectRegistration('52998224725', key)
    expect(protectedCpf.cpfEncrypted).not.toContain('52998224725')
    expect(revealRegistrationCpf(protectedCpf.cpfEncrypted, key)).toBe('52998224725')
  })
})
