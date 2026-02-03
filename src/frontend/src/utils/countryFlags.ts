/**
 * Convert a two-letter country code to a flag emoji
 * Uses Unicode regional indicator symbols
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) {
    return ''
  }
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => 127397 + c.charCodeAt(0))
  )
}
