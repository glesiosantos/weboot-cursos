import { loadPaymentContext } from '../../utils/payment'
import { paymentPrice } from '../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  const { order } = context
  const config = useRuntimeConfig(event)
  const base = Number(order.unit_price)
  return {
    status: order.status,
    has_open_pix: order.status === 'WAITING_PAYMENT' && order.payment_method === 'PIX' && order.payment_provider === 'MERCADO_PAGO' && Boolean(order.provider_payment_id),
    course_title: order.courses?.title ?? 'Curso',
    expires_at: order.expires_at,
    has_card_checkout: Boolean(order.provider_preference_id),
    prices: {
      pix: paymentPrice(base, 'PIX', 1, config),
      card: Array.from({ length: 3 }, (_, index) => paymentPrice(base, 'CREDIT_CARD', index + 1, config)),
    },
  }
})
