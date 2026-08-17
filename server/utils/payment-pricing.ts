export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export type PaymentFeeConfig = {
  asaasPixPercent: number | string
  asaasPixFixed: number | string
  asaasCardCashPercent: number | string
  asaasCardInstallmentPercent: number | string
  asaasCardFixed: number | string
  paymentServiceFee: number | string
}

export const paymentPrice = (base: number, method: 'PIX' | 'CREDIT_CARD', installments: number, config: PaymentFeeConfig) => {
  const hasInstallmentFee = method === 'CREDIT_CARD' && installments >= 2
  const percent = hasInstallmentFee ? Number(config.asaasCardInstallmentPercent) : 0
  const fixed = hasInstallmentFee ? Number(config.asaasCardFixed) : 0
  const serviceFee = 0
  const providerFee = money(base * percent / 100 + fixed)
  return { base: money(base), providerFee, serviceFee, total: money(base + providerFee + serviceFee), percent, installments }
}
