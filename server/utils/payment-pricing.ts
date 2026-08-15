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
  const percent = method === 'PIX' ? Number(config.asaasPixPercent) : Number(installments === 1 ? config.asaasCardCashPercent : config.asaasCardInstallmentPercent)
  const fixed = method === 'PIX' ? Number(config.asaasPixFixed) : Number(config.asaasCardFixed)
  const serviceFee = money(Number(config.paymentServiceFee))
  const providerFee = money(base * percent / 100 + fixed)
  return { base: money(base), providerFee, serviceFee, total: money(base + providerFee + serviceFee), percent, installments }
}
