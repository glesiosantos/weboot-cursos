import { describe, expect, it } from 'vitest'
import { normalizeCredentialToken } from '../../server/utils/commercial'

const token = '0123456789ABCDEF0123456789ABCDEF'

describe('event credential token', () => {
  it('accepts the printed manual code', () => {
    expect(normalizeCredentialToken(token.toLowerCase())).toBe(token)
  })

  it('extracts the token from the URL encoded in the QR Code', () => {
    expect(normalizeCredentialToken(`https://cursos.example/checkin/${token}`)).toBe(token)
  })

  it('rejects unrelated URLs and malformed codes', () => {
    expect(normalizeCredentialToken('https://malicious.example/not-a-credential')).toBeNull()
    expect(normalizeCredentialToken('short-code')).toBeNull()
  })
})
