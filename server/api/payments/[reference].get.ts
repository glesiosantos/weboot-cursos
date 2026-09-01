import { loadPaymentContext } from '../../utils/payment'
import { paymentPrice } from '../../utils/payment-pricing'

export default defineEventHandler(async (event) => {
  const { order } = await loadPaymentContext(event)
  const config = useRuntimeConfig(event)
  const base = Number(order.unit_price)
  return {
    status: order.status,
    has_open_pix: order.status === 'WAITING_PAYMENT' && order.payment_method === 'PIX' && order.payment_provider === 'MERCADO_PAGO' && Boolean(order.provider_payment_id),
    course_title: order.courses?.title ?? 'Curso',
    expires_at: order.expires_at,
    prices: {
      pix: paymentPrice(base, 'PIX', 1, config),
    },
  }
})
