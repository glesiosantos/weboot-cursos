type MercadoPagoError = { message?: string, cause?: { description?: string }[] }
type MercadoPagoPayment = MercadoPagoError & {
  id?: number
  status?: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  date_of_expiration?: string
  point_of_interaction?: { transaction_data?: { qr_code?: string, qr_code_base64?: string, ticket_url?: string } }
}

export type MercadoPagoPayer = { email: string, firstName: string, lastName: string, cpf: string }

export class MercadoPagoPaymentProvider {
  private readonly apiUrl = 'https://api.mercadopago.com'

  constructor(private readonly accessToken: string) {
    if (!accessToken) { throw createError({ statusCode: 503, statusMessage: 'Mercado Pago não configurado' }) }
  }

  private async request<T extends MercadoPagoError>(path: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: { 'accept': 'application/json', 'authorization': `Bearer ${this.accessToken}`, 'content-type': 'application/json', ...options.headers },
    })
    const payload = await response.json() as T
    if (!response.ok) {
      throw createError({ statusCode: 422, statusMessage: payload.cause?.[0]?.description ?? payload.message ?? 'Pagamento recusado pelo Mercado Pago' })
    }
    return payload
  }

  async createPixPayment(input: { idempotencyKey: string, amount: number, description: string, externalReference: string, expirationDate: string, notificationUrl?: string, payer: MercadoPagoPayer }) {
    const payload = await this.request<MercadoPagoPayment>('/v1/payments', {
      method: 'POST', headers: { 'X-Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        transaction_amount: input.amount, description: input.description, payment_method_id: 'pix',
        external_reference: input.externalReference, date_of_expiration: new Date(input.expirationDate).toISOString(),
        ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
        payer: { email: input.payer.email, first_name: input.payer.firstName, last_name: input.payer.lastName, identification: { type: 'CPF', number: input.payer.cpf } },
      }),
    })
    return this.normalizePayment(payload, true)
  }

  async createCardPayment(input: { idempotencyKey: string, amount: number, description: string, externalReference: string, notificationUrl?: string, token: string, paymentMethodId: string, issuerId?: string, installments: number, payer: MercadoPagoPayer }) {
    const payload = await this.request<MercadoPagoPayment>('/v1/payments', {
      method: 'POST', headers: { 'X-Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        transaction_amount: input.amount, token: input.token, description: input.description,
        installments: input.installments, payment_method_id: input.paymentMethodId,
        ...(input.issuerId ? { issuer_id: input.issuerId } : {}), external_reference: input.externalReference,
        ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
        payer: { email: input.payer.email, first_name: input.payer.firstName, last_name: input.payer.lastName, identification: { type: 'CPF', number: input.payer.cpf } },
      }),
    })
    return this.normalizePayment(payload, false)
  }

  async getPayment(paymentId: string) {
    const payload = await this.request<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' })
    return this.normalizePayment(payload, false)
  }

  private normalizePayment(payload: MercadoPagoPayment, requireQrCode: boolean) {
    const transaction = payload.point_of_interaction?.transaction_data
    if (payload.id === undefined || !payload.status) { throw createError({ statusCode: 502, statusMessage: 'Resposta inválida do Mercado Pago' }) }
    if (requireQrCode && (!transaction?.qr_code || !transaction.qr_code_base64)) { throw createError({ statusCode: 502, statusMessage: 'QR Code Pix indisponível' }) }
    return {
      id: String(payload.id), status: payload.status, statusDetail: payload.status_detail,
      externalReference: payload.external_reference, value: payload.transaction_amount,
      encodedImage: transaction?.qr_code_base64, payload: transaction?.qr_code,
      ticketUrl: transaction?.ticket_url, expirationDate: payload.date_of_expiration,
    }
  }
}
