import type { HostedCheckout, HostedCheckoutInput, PaymentProvider } from './payment-provider'

type AsaasCheckoutResponse = { id?: string, link?: string, status?: string, errors?: { description?: string }[] }
type CheckoutFetch = (url: string, options: Record<string, unknown>) => Promise<AsaasCheckoutResponse>
const ASAAS_ITEM_NAME_MAX_LENGTH = 30

const toAsaasItemName = (courseTitle: string) => {
  const normalizedTitle = courseTitle.trim()
  const characters = Array.from(normalizedTitle)
  if (characters.length <= ASAAS_ITEM_NAME_MAX_LENGTH) { return normalizedTitle }
  return `${characters.slice(0, ASAAS_ITEM_NAME_MAX_LENGTH - 1).join('')}…`
}

const defaultCheckoutFetch: CheckoutFetch = async (url, options) => {
  const response = await fetch(url, {
    method: String(options.method),
    headers: options.headers as HeadersInit,
    body: JSON.stringify(options.body),
  })
  const payload = await response.json() as AsaasCheckoutResponse
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: payload.errors?.[0]?.description ?? 'Falha ao criar Checkout no Asaas' })
  }
  return payload
}

export class AsaasHostedCheckoutProvider implements PaymentProvider {
  constructor(private readonly apiUrl: string, private readonly apiKey: string, private readonly request: CheckoutFetch = defaultCheckoutFetch) {}

  async createHostedCheckout(input: HostedCheckoutInput): Promise<HostedCheckout> {
    if (!this.apiUrl.includes('api-sandbox.asaas.com')) {
      throw createError({ statusCode: 503, statusMessage: 'Checkout liberado exclusivamente no Asaas Sandbox nesta fase' })
    }
    const checkoutPhone = (input.customer.mobilePhone ?? input.customer.phone ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
    const response = await this.request(`${this.apiUrl.replace(/\/$/, '')}/checkouts`, {
      method: 'POST',
      headers: { 'accept': 'application/json', 'access_token': this.apiKey, 'content-type': 'application/json' },
      body: {
        billingTypes: ['PIX', 'CREDIT_CARD'],
        chargeTypes: ['DETACHED'],
        minutesToExpire: input.expiresInMinutes,
        externalReference: input.orderId,
        callback: {
          successUrl: input.callbackUrl,
          cancelUrl: input.callbackUrl,
          expiredUrl: input.callbackUrl,
        },
        items: [{ externalReference: input.courseId, name: toAsaasItemName(input.courseTitle), quantity: 1, value: input.amount }],
        customerData: {
          name: input.customer.name,
          email: input.customer.email,
          ...(input.customer.cpfCnpj ? { cpfCnpj: input.customer.cpfCnpj } : {}),
          ...(checkoutPhone ? { phone: checkoutPhone } : {}),
        },
      },
    })
    if (!response.id) {
      throw createError({ statusCode: 502, statusMessage: response.errors?.[0]?.description ?? 'Resposta inválida do Asaas' })
    }
    return {
      id: response.id,
      url: response.link ?? `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(response.id)}`,
      status: response.status ?? 'ACTIVE',
    }
  }
}
