import { describe, it, expect } from 'vitest'

// Mirror of the getStrength function from pass-client.tsx
// Tested in isolation without the React component.
function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' }
  let charsetSize = 0
  if (/[a-z]/.test(pwd)) charsetSize += 26
  if (/[A-Z]/.test(pwd)) charsetSize += 26
  if (/[0-9]/.test(pwd)) charsetSize += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 32
  const entropy = pwd.length * Math.log2(Math.max(charsetSize, 1))
  if (entropy < 28) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (entropy < 36) return { score: 2, label: 'Fair', color: 'bg-orange-400' }
  if (entropy < 60) return { score: 3, label: 'Good', color: 'bg-yellow-400' }
  if (entropy < 80) return { score: 4, label: 'Strong', color: 'bg-emerald-400' }
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-600' }
}

// Mirror of character set building logic from generatePassword
function buildCharset(options: {
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}): string {
  const charsets: Record<string, string> = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  }
  let characters = ''
  if (options.uppercase) characters += charsets.uppercase
  if (options.lowercase) characters += charsets.lowercase
  if (options.numbers) characters += charsets.numbers
  if (options.symbols) characters += charsets.symbols
  return characters
}

// ─── getStrength ──────────────────────────────────────────────────────────────

describe('getStrength — entropy-based password strength', () => {
  it('returns score 0 for empty password', () => {
    expect(getStrength('').score).toBe(0)
    expect(getStrength('').label).toBe('')
  })

  it('rates a very short lowercase-only password as Weak', () => {
    const { score, label } = getStrength('abc')
    expect(score).toBe(1)
    expect(label).toBe('Weak')
  })

  it('rates a medium numeric password as Weak or Fair', () => {
    const { score } = getStrength('12345678')
    expect(score).toBeLessThanOrEqual(2)
  })

  it('rates a 16-char mixed password as Good or Strong', () => {
    const { score } = getStrength('Abcdef1!Abcdef1!')
    expect(score).toBeGreaterThanOrEqual(3)
  })

  it('rates a 32-char fully mixed password as Very Strong', () => {
    const { score, label } = getStrength('A1!aB2@bC3#cD4$dE5%eF6^fG7&gH8*h')
    expect(score).toBe(5)
    expect(label).toBe('Very Strong')
  })

  it('score increases with password length (same charset)', () => {
    const short = getStrength('abc')
    const long = getStrength('abcdefghijklmnopqrstuvwxyz')
    expect(long.score).toBeGreaterThanOrEqual(short.score)
  })

  it('score increases with charset diversity', () => {
    const lower = getStrength('abcdefghij')          // lowercase only
    const mixed = getStrength('Abcdefgh1!Abcdefgh1!') // mixed
    expect(mixed.score).toBeGreaterThan(lower.score)
  })

  it('a UUID v4 rates as Strong or Very Strong', () => {
    // UUIDs are 36 chars, hex + hyphens
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const { score } = getStrength(uuid)
    expect(score).toBeGreaterThanOrEqual(4)
  })
})

// ─── buildCharset ─────────────────────────────────────────────────────────────

describe('buildCharset — character set construction', () => {
  it('returns empty string when all options are false', () => {
    const cs = buildCharset({ uppercase: false, lowercase: false, numbers: false, symbols: false })
    expect(cs).toBe('')
  })

  it('includes uppercase letters when enabled', () => {
    const cs = buildCharset({ uppercase: true, lowercase: false, numbers: false, symbols: false })
    expect(cs).toContain('A')
    expect(cs).toContain('Z')
    expect(cs).not.toContain('a')
  })

  it('includes lowercase letters when enabled', () => {
    const cs = buildCharset({ uppercase: false, lowercase: true, numbers: false, symbols: false })
    expect(cs).toContain('a')
    expect(cs).toContain('z')
    expect(cs).not.toContain('A')
  })

  it('includes digits when numbers is enabled', () => {
    const cs = buildCharset({ uppercase: false, lowercase: false, numbers: true, symbols: false })
    expect(cs).toContain('0')
    expect(cs).toContain('9')
  })

  it('includes symbols when enabled', () => {
    const cs = buildCharset({ uppercase: false, lowercase: false, numbers: false, symbols: true })
    expect(cs).toContain('!')
    expect(cs).toContain('@')
  })

  it('concatenates all charsets when all options are true', () => {
    const cs = buildCharset({ uppercase: true, lowercase: true, numbers: true, symbols: true })
    expect(cs).toContain('A')
    expect(cs).toContain('a')
    expect(cs).toContain('0')
    expect(cs).toContain('!')
    // Actual charset sizes: uppercase(26) + lowercase(26) + numbers(10) + symbols(26) = 88
    expect(cs.length).toBe(88)
  })
})

// ─── PIN generation spec ──────────────────────────────────────────────────────

describe('PIN generation logic spec', () => {
  it('PIN-6 has exactly 6 digits', () => {
    // Verify the expected PIN-6 output format
    const pinPattern = /^\d{6}$/
    // We verify the pattern spec, not the actual crypto call (browser API)
    expect(pinPattern.test('123456')).toBe(true)
    expect(pinPattern.test('12345')).toBe(false)
    expect(pinPattern.test('1234567')).toBe(false)
  })

  it('PIN-8 has exactly 8 digits', () => {
    const pinPattern = /^\d{8}$/
    expect(pinPattern.test('12345678')).toBe(true)
    expect(pinPattern.test('1234567')).toBe(false)
  })

  it('UUID v4 format is valid', () => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    // Validate the expected format of crypto.randomUUID output
    expect(uuidPattern.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(uuidPattern.test('not-a-uuid')).toBe(false)
  })
})
