type MercadoPagoError = { message?: string, error?: string, cause?: { description?: string }[] }
type MercadoPagoPayment = MercadoPagoError & {
  id?: number
  status?: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  payment_type_id?: string
  installments?: number
  date_of_expiration?: string
  point_of_interaction?: {
    transaction_data?: { qr_code?: string, qr_code_base64?: string, ticket_url?: string }
  }
}

export type MercadoPagoPayer = {
  email: string
  firstName: string
  lastName: string
  cpf: string
}

export class MercadoPagoPaymentProvider {
  private readonly apiUrl = 'https://api.mercadopago.com'

  constructor(private readonly accessToken: string) {}

  private async request<T extends MercadoPagoError>(path: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${this.accessToken}`,
        'content-type': 'application/json',
        ...options.headers,
      },
    })
    const payload = await response.json() as T
    if (!response.ok) {
      throw createError({
        statusCode: 422,
        statusMessage: payload.cause?.[0]?.description ?? payload.message ?? 'Pagamento recusado pelo Mercado Pago',
      })
    }
    return payload
  }

  async createPixPayment(input: {
    idempotencyKey: string
    amount: number
    description: string
    externalReference: string
    expirationDate: string
    notificationUrl?: string
    payer: MercadoPagoPayer
  }) {
    const names = { first_name: input.payer.firstName, last_name: input.payer.lastName }
    const payload = await this.request<MercadoPagoPayment>('/v1/payments', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: 'pix',
        external_reference: input.externalReference,
        date_of_expiration: new Date(input.expirationDate).toISOString(),
        ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
        payer: {
          email: input.payer.email,
          ...names,
          identification: { type: 'CPF', number: input.payer.cpf },
        },
      }),
    })
    return this.normalizePayment(payload, true)
  }

  async createCardPayment(input: {
    idempotencyKey: string
    amount: number
    description: string
    externalReference: string
    notificationUrl?: string
    token: string
    paymentMethodId: string
    issuerId?: string
    installments: number
    payer: MercadoPagoPayer
  }) {
    const payload = await this.request<MercadoPagoPayment>('/v1/payments', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        transaction_amount: input.amount,
        token: input.token,
        description: input.description,
        installments: input.installments,
        payment_method_id: input.paymentMethodId,
        ...(input.issuerId ? { issuer_id: input.issuerId } : {}),
        external_reference: input.externalReference,
        ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
        payer: {
          email: input.payer.email,
          first_name: input.payer.firstName,
          last_name: input.payer.lastName,
          identification: { type: 'CPF', number: input.payer.cpf },
        },
      }),
    })
    return this.normalizePayment(payload, false)
  }

  async createCardPreference(input: {
    amount: number
    title: string
    externalReference: string
    notificationUrl?: string
    successUrl: string
    failureUrl: string
    pendingUrl: string
    payer: MercadoPagoPayer
  }) {
    const payload = await this.request<MercadoPagoError & { id?: string, init_point?: string, sandbox_init_point?: string }>('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: input.externalReference, title: input.title, quantity: 1, currency_id: 'BRL', unit_price: input.amount }],
        external_reference: input.externalReference,
        payer: { email: input.payer.email, name: input.payer.firstName, surname: input.payer.lastName, identification: { type: 'CPF', number: input.payer.cpf } },
        payment_methods: {
          installments: 3,
          default_installments: 1,
          excluded_payment_types: ['ticket', 'bank_transfer', 'atm', 'debit_card', 'prepaid_card', 'digital_currency', 'voucher_card'].map(id => ({ id })),
        },
        back_urls: { success: input.successUrl, failure: input.failureUrl, pending: input.pendingUrl },
        auto_return: 'approved',
        ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
      }),
    })
    if (!payload.id || !payload.init_point) {
      throw createError({ statusCode: 502, statusMessage: 'Checkout do Mercado Pago indisponível' })
    }
    return { id: payload.id, initPoint: payload.init_point, sandboxInitPoint: payload.sandbox_init_point }
  }

  async getPreference(preferenceId: string) {
    return this.request<MercadoPagoError & { id?: string, init_point?: string, sandbox_init_point?: string }>(`/checkout/preferences/${encodeURIComponent(preferenceId)}`, { method: 'GET' })
  }

  async searchPayments(externalReference: string) {
    const query = new URLSearchParams({ external_reference: externalReference, sort: 'date_created', criteria: 'desc', limit: '20' })
    const payload = await this.request<MercadoPagoError & { results?: MercadoPagoPayment[] }>(`/v1/payments/search?${query}`, { method: 'GET' })
    return (payload.results ?? []).map(payment => this.normalizePayment(payment, false))
  }

  async getPayment(paymentId: string) {
    const payload = await this.request<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' })
    return this.normalizePayment(payload, false)
  }

  private normalizePayment(payload: MercadoPagoPayment, requireQrCode: boolean) {
    if (payload.id === undefined || !payload.status) {
      throw createError({ statusCode: 502, statusMessage: 'Resposta inválida ao consultar pagamento' })
    }
    const pix = payload.point_of_interaction?.transaction_data
    if (requireQrCode && (!pix?.qr_code || !pix.qr_code_base64)) {
      throw createError({ statusCode: 502, statusMessage: 'QR Code Pix indisponível' })
    }
    return {
      id: String(payload.id),
      status: payload.status,
      statusDetail: payload.status_detail,
      externalReference: payload.external_reference,
      value: payload.transaction_amount,
      paymentTypeId: payload.payment_type_id,
      installments: payload.installments,
      encodedImage: pix?.qr_code_base64,
      qrCodeBase64: pix?.qr_code_base64,
      payload: pix?.qr_code,
      ticketUrl: pix?.ticket_url,
      expirationDate: payload.date_of_expiration,
    }
  }
}
