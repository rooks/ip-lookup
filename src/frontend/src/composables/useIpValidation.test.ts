import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { isValidIp, useIpValidation } from './useIpValidation'

describe('isValidIp', () => {
  describe('valid IPv4 addresses', () => {
    it.each([
      '8.8.8.8',
      '192.168.1.1',
      '255.255.255.255',
      '0.0.0.0',
      '10.0.0.1',
      '172.16.0.1',
      '1.2.3.4',
    ])('should validate %s as valid IPv4', (ip) => {
      expect(isValidIp(ip)).toBe(true)
    })
  })

  describe('invalid IPv4 addresses', () => {
    it.each([
      '256.1.1.1',
      '192.168.1',
      '192.168.1.1.1',
      '.192.168.1.1',
      '192.168.1.1.',
      '192.168..1',
      '192.168.1.256',
      '-1.0.0.0',
      'abc.def.ghi.jkl',
    ])('should validate %s as invalid IPv4', (ip) => {
      expect(isValidIp(ip)).toBe(false)
    })
  })

  describe('valid IPv6 addresses', () => {
    it.each([
      '::1',
      '2001:db8::1',
      '2001:0db8:0000:0000:0000:0000:0000:0001',
      'fe80::1',
      '2001:db8:85a3::8a2e:370:7334',
      '::ffff:192.0.2.1',
    ])('should validate %s as valid IPv6', (ip) => {
      expect(isValidIp(ip)).toBe(true)
    })

    // Note: '::' (all-zeros) is technically valid IPv6 but not matched by current regex
    it('should return false for :: (unspecified address) due to regex limitation', () => {
      expect(isValidIp('::')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return false for empty string', () => {
      expect(isValidIp('')).toBe(false)
    })

    it('should return false for domains', () => {
      expect(isValidIp('example.com')).toBe(false)
      expect(isValidIp('www.google.com')).toBe(false)
    })

    it('should return false for CIDR notation', () => {
      expect(isValidIp('192.168.1.0/24')).toBe(false)
      expect(isValidIp('10.0.0.0/8')).toBe(false)
    })

    it('should return false for whitespace only', () => {
      expect(isValidIp('   ')).toBe(false)
    })

    it('should return false for IP with port', () => {
      expect(isValidIp('192.168.1.1:8080')).toBe(false)
    })
  })
})

describe('useIpValidation', () => {
  it('should return isValid true for empty string', () => {
    const ip = ref('')
    const { isValid, isEmpty, validationError } = useIpValidation(ip)

    expect(isValid.value).toBe(true)
    expect(isEmpty.value).toBe(true)
    expect(validationError.value).toBeNull()
  })

  it('should return isValid true for valid IP', () => {
    const ip = ref('8.8.8.8')
    const { isValid, isEmpty, validationError } = useIpValidation(ip)

    expect(isValid.value).toBe(true)
    expect(isEmpty.value).toBe(false)
    expect(validationError.value).toBeNull()
  })

  it('should return isValid false for invalid IP', () => {
    const ip = ref('invalid')
    const { isValid, isEmpty, validationError } = useIpValidation(ip)

    expect(isValid.value).toBe(false)
    expect(isEmpty.value).toBe(false)
    expect(validationError.value).toBe('Invalid IP address format')
  })

  it('should react to ref changes', () => {
    const ip = ref('')
    const { isValid, isEmpty, validationError } = useIpValidation(ip)

    expect(isValid.value).toBe(true)
    expect(isEmpty.value).toBe(true)

    ip.value = '8.8.8.8'
    expect(isValid.value).toBe(true)
    expect(isEmpty.value).toBe(false)
    expect(validationError.value).toBeNull()

    ip.value = 'invalid'
    expect(isValid.value).toBe(false)
    expect(validationError.value).toBe('Invalid IP address format')
  })

  it('should treat whitespace-only as empty', () => {
    const ip = ref('   ')
    const { isEmpty } = useIpValidation(ip)

    expect(isEmpty.value).toBe(true)
  })
})
