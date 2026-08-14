import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AsaasHostedCheckoutProvider } from '../../server/services/asaas-hosted-checkout.provider'

const input = {
  orderId: 'a174f612-35c6-45c0-bf07-a0047bb6fdd3',
  courseId: 'e36223e9-0e14-4218-940b-b2baa2c79309',
  courseTitle: 'Destravando SQL',
  amount: 199.9,
  expiresInMinutes: 30,
  customer: { name: 'Aluno Teste', email: 'student@example.test', phone: '11999999999' },
  callbackUrl: 'https://app.example.test/checkout/retorno',
}

describe('AsaasHostedCheckoutProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', (value: unknown) => value)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('sends the server price and internal order reference to hosted Sandbox checkout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ id: 'checkout-id', link: 'https://sandbox.asaas.com/checkoutSession/show/checkout-id', status: 'ACTIVE' })
    const provider = new AsaasHostedCheckoutProvider('https://api-sandbox.asaas.com/v3', 'sandbox-key', fetchMock)

    await expect(provider.createHostedCheckout(input)).resolves.toEqual({
      id: 'checkout-id', url: 'https://sandbox.asaas.com/checkoutSession/show/checkout-id', status: 'ACTIVE',
    })
    expect(fetchMock).toHaveBeenCalledWith('https://api-sandbox.asaas.com/v3/checkouts', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ externalReference: input.orderId, minutesToExpire: 30, items: [expect.objectContaining({ value: 199.9 })] }),
    }))
  })

  it('limits the checkout item name to the 30 characters accepted by Asaas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ id: 'checkout-id' })
    const provider = new AsaasHostedCheckoutProvider('https://api-sandbox.asaas.com/v3', 'sandbox-key', fetchMock)
    const longTitle = 'Formação completa em desenvolvimento web moderno'

    await provider.createHostedCheckout({ ...input, courseTitle: longTitle })

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: expect.objectContaining({
        items: [expect.objectContaining({ name: 'Formação completa em desenvol…' })],
      }),
    }))
  })

  it('refuses a production API URL in Fase 03', async () => {
    const provider = new AsaasHostedCheckoutProvider('https://api.asaas.com/v3', 'production-key')
    await expect(provider.createHostedCheckout(input)).rejects.toMatchObject({ statusCode: 503 })
  })
})
