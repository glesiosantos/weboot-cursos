import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync('app/pages/admin/cursos/[id]/inscritos.vue', 'utf8')
const confirmation = readFileSync('server/api/admin/courses/[id]/participants/[orderId]/confirm-payment.post.ts', 'utf8')
const pix = readFileSync('server/api/admin/courses/[id]/participants/[orderId]/pix.post.ts', 'utf8')

describe('admin participant payment actions', () => {
  it('confirms an existing unpaid order only after server-side evidence checks', () => {
    expect(confirmation).toContain('requireRole(event, [\'ADMIN\'])')
    expect(confirmation).toContain('.eq(\'course_id\', courseId)')
    expect(confirmation).toContain('amount_received')
    expect(confirmation).toContain('payment_provider: \'MANUAL\'')
    expect(confirmation).toContain('completeCommercialOrder')
  })

  it('loads or creates Mercado Pago Pix for the selected order', () => {
    expect(pix).toContain('requireRole(event, [\'ADMIN\'])')
    expect(pix).toContain('provider.getPayment')
    expect(pix).toContain('provider.createPixPayment')
    expect(pix).toContain('payment_provider: \'MERCADO_PAGO\'')
    expect(pix).toContain('A reserva expirou')
  })

  it('exposes both actions in each non-enrolled participant row', () => {
    expect(page).toContain('Confirmar pagamento e matricular')
    expect(page).toContain('Obter QR Code Pix')
    expect(page).toContain('Copiar código Pix')
  })
})
