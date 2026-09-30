import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MercadoPagoPaymentProvider } from '../../server/services/mercado-pago-payment.provider'

describe('MercadoPagoPaymentProvider', () => {
  beforeEach(() => vi.stubGlobal('createError', (value: unknown) => value))
  afterEach(() => vi.unstubAllGlobals())

  it('creates a Pix with the payer, external reference, expiration, and idempotency key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 12345, status: 'pending', external_reference: 'order-1', transaction_amount: 100, point_of_interaction: { transaction_data: { qr_code: 'pix-copy', qr_code_base64: 'base64' } } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new MercadoPagoPaymentProvider('test-token')
    const result = await provider.createPixPayment({
      idempotencyKey: 'order-1', amount: 100, description: 'Curso', externalReference: 'order-1',
      expirationDate: '2026-10-01T12:00:00.000Z', payer: { email: 'buyer@test.com', firstName: 'Maria', lastName: 'Silva', cpf: '52998224725' },
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.mercadopago.com/v1/payments', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ 'authorization': 'Bearer test-token', 'X-Idempotency-Key': 'order-1' }),
    }))
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      payment_method_id: 'pix', external_reference: 'order-1', transaction_amount: 100,
      payer: { email: 'buyer@test.com', identification: { type: 'CPF', number: '52998224725' } },
    })
    expect(result).toMatchObject({ id: '12345', status: 'pending', payload: 'pix-copy', encodedImage: 'base64' })
  })

  it('sends a tokenized card payment and never sends raw card details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 999, status: 'approved', status_detail: 'accredited', external_reference: 'order-2', transaction_amount: 150 }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new MercadoPagoPaymentProvider('test-token')
    await provider.createCardPayment({
      idempotencyKey: 'order-2', amount: 150, description: 'Curso', externalReference: 'order-2',
      token: 'secure-card-token', paymentMethodId: 'visa', issuerId: '1', installments: 3,
      payer: { email: 'buyer@test.com', firstName: 'Maria', lastName: 'Silva', cpf: '52998224725' },
    })
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body).toMatchObject({ token: 'secure-card-token', payment_method_id: 'visa', issuer_id: '1', installments: 3 })
    expect(body).not.toHaveProperty('card_number')
    expect(body).not.toHaveProperty('security_code')
    expect(body).not.toHaveProperty('ccv')
  })

  it('reads authoritative payment status without a GET body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 999, status: 'approved', external_reference: 'order-2', transaction_amount: 150 }) })
    vi.stubGlobal('fetch', fetchMock)
    const payment = await new MercadoPagoPaymentProvider('test-token').getPayment('999')
    expect(fetchMock).toHaveBeenCalledWith('https://api.mercadopago.com/v1/payments/999', expect.objectContaining({ method: 'GET' }))
    expect(fetchMock.mock.calls[0]![1]).not.toHaveProperty('body')
    expect(payment.status).toBe('approved')
  })
})
