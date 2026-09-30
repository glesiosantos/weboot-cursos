import { loadPaymentContext } from '../../utils/payment'
import { paymentPrice } from '../../utils/payment-pricing'
import { revealRegistrationCpf } from '../../utils/registration'

export default defineEventHandler(async (event) => {
  const context = await loadPaymentContext(event)
  const { order } = context
  const config = useRuntimeConfig(event)
  const base = Number(order.unit_price)
  return {
    status: order.status,
    has_open_pix: order.status === 'WAITING_PAYMENT' && order.payment_method === 'PIX' && Boolean(order.provider_payment_id || order.asaas_payment_id),
    course_title: order.courses?.title ?? 'Curso',
    expires_at: order.expires_at,
    mercado_pago_public_key: String(config.public.mercadoPagoPublicKey || ''),
    payer_email: context.contact.email,
    payer_cpf: revealRegistrationCpf(context.contact.cpf_encrypted, String(config.registrationDataKey || '')),
    prices: {
      pix: paymentPrice(base, 'PIX', 1, config),
      card: Array.from({ length: 6 }, (_, index) => paymentPrice(base, 'CREDIT_CARD', index + 1, config)),
    },
  }
})
