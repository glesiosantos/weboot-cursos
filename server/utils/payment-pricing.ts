export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export type PaymentFeeConfig = {
  mercadoPagoPixPercent: number | string
  mercadoPagoPixFixed: number | string
  paymentServiceFee: number | string
}

export const paymentPrice = (base: number, method: 'PIX' | 'CREDIT_CARD', installments: number, config: PaymentFeeConfig) => {
  const percent = method === 'PIX' ? Number(config.mercadoPagoPixPercent) : 0
  const fixed = method === 'PIX' ? Number(config.mercadoPagoPixFixed) : 0
  const serviceFee = 0
  const providerFee = money(base * percent / 100 + fixed)
  return { base: money(base), providerFee, serviceFee, total: money(base + providerFee + serviceFee), percent, installments }
}
