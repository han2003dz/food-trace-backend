export default function getLast6Chars(str?: string | null): string {
  if (!str) return ''
  return str.slice(-6)
}
