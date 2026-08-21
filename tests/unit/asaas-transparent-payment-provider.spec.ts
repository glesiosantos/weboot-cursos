import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AsaasTransparentPaymentProvider } from '../../server/services/asaas-transparent-payment.provider'

describe('AsaasTransparentPaymentProvider', () => {
  beforeEach(() => vi.stubGlobal('createError', (value: unknown) => value))
  afterEach(() => vi.unstubAllGlobals())

  it('accepts the official production API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'pay_pix', status: 'PENDING' }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new AsaasTransparentPaymentProvider('https://api.asaas.com/v3', 'key')

    await provider.createPixPayment({ customer: 'cus_1', value: 100, dueDate: '2026-08-20', description: 'Curso', externalReference: 'order-1' })

    expect(fetchMock).toHaveBeenCalledWith('https://api.asaas.com/v3/payments', expect.any(Object))
  })

  it('rejects non-official API URLs', () => {
    expect(() => new AsaasTransparentPaymentProvider('https://api.asaas.com.example.com/v3', 'key'))
      .toThrow(expect.objectContaining({ statusMessage: 'URL da API Asaas não permitida' }))
  })

  it('creates a Pix payment and retrieves its QR Code without a GET body', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'pay_pix', status: 'PENDING' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ encodedImage: 'base64', payload: 'pix-code' }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new AsaasTransparentPaymentProvider('https://api-sandbox.asaas.com/v3', 'key')

    await provider.createPixPayment({ customer: 'cus_1', value: 106.99, dueDate: '2026-08-15', description: 'Curso', externalReference: 'order-1' })
    await provider.getPixQrCode('pay_pix')

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({ billingType: 'PIX', value: 106.99, externalReference: 'order-1' })
    expect(fetchMock.mock.calls[1]![1]).not.toHaveProperty('body')
  })

  it('sends the total and installment count for card processing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'pay_card', status: 'CONFIRMED' }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new AsaasTransparentPaymentProvider('https://api-sandbox.asaas.com/v3', 'key')

    await provider.createCardPayment({
      customer: 'cus_1', value: 108.98, dueDate: '2026-08-15', description: 'Curso', externalReference: 'order-1',
      installmentCount: 6, remoteIp: '203.0.113.10',
      creditCard: { holderName: 'Maria Silva', number: '4111111111111111', expiryMonth: '12', expiryYear: '2030', ccv: '123' },
      creditCardHolderInfo: { name: 'Maria Silva', email: 'maria@example.com', cpfCnpj: '52998224725', phone: '5586999999999', mobilePhone: '5586999999999' },
    })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body).toMatchObject({ billingType: 'CREDIT_CARD', installmentCount: 6, totalValue: 108.98, remoteIp: '203.0.113.10' })
  })
})
