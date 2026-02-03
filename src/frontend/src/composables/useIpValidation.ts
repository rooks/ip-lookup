import { computed, type Ref } from 'vue'

// IPv4 regex pattern
const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// IPv6 regex pattern (simplified, covers most common formats)
const IPV6_PATTERN = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::(?:[fF]{4}:)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/

export function isValidIp(ip: string): boolean {
  if (!ip) return false
  return IPV4_PATTERN.test(ip) || IPV6_PATTERN.test(ip)
}

export function useIpValidation(ip: Ref<string>) {
  const isValid = computed(() => {
    if (!ip.value) return true // Empty is not invalid, just empty
    return isValidIp(ip.value)
  })

  const isEmpty = computed(() => !ip.value || ip.value.trim() === '')

  const validationError = computed(() => {
    if (isEmpty.value) return null
    if (!isValid.value) return 'Invalid IP address format'
    return null
  })

  return {
    isValid,
    isEmpty,
    validationError,
  }
}
