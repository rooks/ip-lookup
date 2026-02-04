import { describe, it, expect } from 'vitest'
import { countryCodeToFlag } from './countryFlags'

describe('countryCodeToFlag', () => {
  it('should convert to flag emoji', () => {
    expect(countryCodeToFlag('US')).toBe('🇺🇸')
  })

  it('should handle lowercase input', () => {
    expect(countryCodeToFlag('us')).toBe('🇺🇸')
    expect(countryCodeToFlag('gb')).toBe('🇬🇧')
  })

  it('should handle mixed case input', () => {
    expect(countryCodeToFlag('Us')).toBe('🇺🇸')
    expect(countryCodeToFlag('gB')).toBe('🇬🇧')
  })

  it('should return empty string for empty input', () => {
    expect(countryCodeToFlag('')).toBe('')
  })

  it('should return empty string for single character', () => {
    expect(countryCodeToFlag('U')).toBe('')
  })

  it('should return empty string for more than 2 characters', () => {
    expect(countryCodeToFlag('USA')).toBe('')
    expect(countryCodeToFlag('USAA')).toBe('')
  })

  it('should handle various country codes', () => {
    const codes = [
      { code: 'CA', flag: '🇨🇦' },
      { code: 'AU', flag: '🇦🇺' },
      { code: 'BR', flag: '🇧🇷' },
      { code: 'CN', flag: '🇨🇳' },
      { code: 'IN', flag: '🇮🇳' },
      { code: 'RU', flag: '🇷🇺' },
    ]

    for (const { code, flag } of codes) {
      expect(countryCodeToFlag(code)).toBe(flag)
    }
  })
})
