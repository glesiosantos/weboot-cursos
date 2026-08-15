import { describe, expect, it, vi } from 'vitest'
import { paymentPrice } from '../../server/utils/payment-pricing'
import { protectRegistration, revealRegistrationCpf } from '../../server/utils/registration'

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
