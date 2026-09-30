import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MercadoPagoPaymentProvider } from '../../server/services/mercado-pago-payment.provider'

describe('MercadoPagoPaymentProvider', () => {
  beforeEach(() => vi.stubGlobal('createError', (value: unknown) => value))
  afterEach(() => vi.unstubAllGlobals())

  it('creates Pix with bearer authentication, idempotency and payer identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 123, status: 'pending', external_reference: 'order-1', transaction_amount: 100,
      point_of_interaction: { transaction_data: { qr_code: 'pix-code', qr_code_base64: 'base64' } },
    }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new MercadoPagoPaymentProvider('APP_USR-token')
    await provider.createPixPayment({
      idempotencyKey: 'order-1', amount: 100, description: 'Curso', externalReference: 'order-1',
      expirationDate: '2026-09-01T18:00:00.393869+00:00', notificationUrl: 'https://example.com/api/webhooks/mercado-pago',
      payer: { email: 'maria@example.com', firstName: 'Maria', lastName: 'Silva', cpf: '52998224725' },
    })
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.mercadopago.com/v1/payments')
    expect(options.headers).toMatchObject({ 'authorization': 'Bearer APP_USR-token', 'X-Idempotency-Key': 'order-1' })
    expect(JSON.parse(options.body)).toMatchObject({
      transaction_amount: 100, payment_method_id: 'pix', external_reference: 'order-1', date_of_expiration: '2026-09-01T18:00:00.393Z',
      payer: { email: 'maria@example.com', identification: { type: 'CPF', number: '52998224725' } },
    })
  })

  it('retrieves authoritative payment state without a GET body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 123, status: 'approved', external_reference: 'order-1', transaction_amount: 100,
    }) })
    vi.stubGlobal('fetch', fetchMock)
    const payment = await new MercadoPagoPaymentProvider('token').getPayment('123')
    expect(payment).toMatchObject({ id: '123', status: 'approved', externalReference: 'order-1', value: 100 })
    expect(fetchMock.mock.calls[0]![1]).not.toHaveProperty('body')
  })

  it('creates tokenized card payments with installments, payer and idempotency', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 456, status: 'pending', status_detail: 'pending_review_manual',
      external_reference: 'order-card-1', transaction_amount: 125,
    }) })
    vi.stubGlobal('fetch', fetchMock)
    const provider = new MercadoPagoPaymentProvider('APP_USR-token')
    const payment = await provider.createCardPayment({
      idempotencyKey: 'order-card-1', amount: 125, description: 'Curso',
      externalReference: 'order-card-1', token: 'secure-card-token', paymentMethodId: 'visa',
      issuerId: '123', installments: 3,
      payer: { email: 'maria@example.com', firstName: 'Maria', lastName: 'Silva', cpf: '52998224725' },
    })
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.mercadopago.com/v1/payments')
    expect(options.headers).toMatchObject({ 'authorization': 'Bearer APP_USR-token', 'X-Idempotency-Key': 'order-card-1' })
    expect(JSON.parse(options.body)).toMatchObject({
      transaction_amount: 125, token: 'secure-card-token', payment_method_id: 'visa', issuer_id: '123',
      installments: 3, external_reference: 'order-card-1',
      payer: { email: 'maria@example.com', identification: { type: 'CPF', number: '52998224725' } },
    })
    expect(payment).toMatchObject({ id: '456', status: 'pending', statusDetail: 'pending_review_manual' })
  })
})
