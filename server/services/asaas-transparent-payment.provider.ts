type AsaasError = { errors?: { description?: string }[] }
type AsaasCustomer = AsaasError & { id?: string }
type AsaasPayment = AsaasError & { id?: string, status?: string, installment?: string }
type PixQrCode = AsaasError & { encodedImage?: string, payload?: string, expirationDate?: string }

export type CustomerInput = {
  name: string
  cpfCnpj: string
  email: string
  mobilePhone: string
  address: string
  addressNumber: string
  complement?: string
  province: string
  postalCode: string
  externalReference: string
}
export type CardInput = {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}
export type HolderInput = {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone: string
  mobilePhone: string
}

export class AsaasTransparentPaymentProvider {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {
    if (!apiUrl.includes('api-sandbox.asaas.com')) {
      throw createError({ statusCode: 503, statusMessage: 'Pagamentos liberados exclusivamente no Asaas Sandbox nesta fase' })
    }
  }

  private async request<T extends AsaasError>(path: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      headers: { 'accept': 'application/json', 'access_token': this.apiKey, 'content-type': 'application/json' },
    })
    const payload = await response.json() as T
    if (!response.ok) {
      throw createError({ statusCode: 422, statusMessage: payload.errors?.[0]?.description ?? 'Pagamento recusado pelo Asaas' })
    }
    return payload
  }

  async createCustomer(input: CustomerInput) {
    const payload = await this.request<AsaasCustomer>('/customers', { method: 'POST', body: JSON.stringify(input) })
    if (!payload.id) { throw createError({ statusCode: 502, statusMessage: 'Resposta inválida ao cadastrar pagador' }) }
    return payload.id
  }

  async createPixPayment(input: { customer: string, value: number, dueDate: string, description: string, externalReference: string }) {
    const payload = await this.request<AsaasPayment>('/payments', {
      method: 'POST', body: JSON.stringify({ ...input, billingType: 'PIX' }),
    })
    if (!payload.id) { throw createError({ statusCode: 502, statusMessage: 'Resposta inválida ao criar Pix' }) }
    return payload
  }

  async getPixQrCode(paymentId: string) {
    const payload = await this.request<PixQrCode>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`, { method: 'GET' })
    if (!payload.encodedImage || !payload.payload) { throw createError({ statusCode: 502, statusMessage: 'QR Code Pix indisponível' }) }
    return payload
  }

  async createCardPayment(input: {
    customer: string
    value: number
    dueDate: string
    description: string
    externalReference: string
    installmentCount: number
    creditCard: CardInput
    creditCardHolderInfo: HolderInput
    remoteIp: string
  }) {
    const payload = await this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify({ ...input, billingType: 'CREDIT_CARD', totalValue: input.value }),
    })
    if (!payload.id) { throw createError({ statusCode: 502, statusMessage: 'Resposta inválida ao processar cartão' }) }
    return payload
  }
}
