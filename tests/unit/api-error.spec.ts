import { describe, expect, it } from 'vitest'
import { apiErrorMessage } from '../../app/utils/api-error'

describe('apiErrorMessage', () => {
  it('shows the server status message for validation failures', () => {
    const error = { data: { statusMessage: 'Campos pendentes: Descrição, Ao menos um módulo' } }

    expect(apiErrorMessage(error, 'Falha genérica')).toBe('Campos pendentes: Descrição, Ao menos um módulo')
  })

  it('uses the safe fallback when the response has no useful message', () => {
    expect(apiErrorMessage(new Error('[POST] endpoint: 422'), 'Não foi possível publicar o curso.')).toBe('Não foi possível publicar o curso.')
  })
})
