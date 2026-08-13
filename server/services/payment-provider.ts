export type HostedCheckoutInput = {
  orderId: string
  courseId: string
  courseTitle: string
  amount: number
  expiresInMinutes: number
  customer: { name: string, email: string, phone?: string, cpfCnpj?: string, mobilePhone?: string }
  callbackUrl: string
}

export type HostedCheckout = { id: string, url: string, status: string }

export interface PaymentProvider {
  createHostedCheckout(input: HostedCheckoutInput): Promise<HostedCheckout>
}
