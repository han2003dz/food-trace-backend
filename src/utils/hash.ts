import { keccak256, sha256, toUtf8Bytes } from 'ethers/lib/utils'

type Plain = Record<string, any>

export function canonicalize(obj: Plain): string {
  const normalize = (v: any): any => {
    if (v === null || v === undefined) return null
    if (Array.isArray(v)) return v.map(normalize)
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'object') {
      const sorted = Object.keys(v).sort()
      const out: any = {}
      for (const k of sorted) out[k] = normalize(v[k])
      return out
    }
    return v
  }
  return JSON.stringify(normalize(obj))
}

export function leafHash(payload: Plain): `0x${string}` {
  const canon = canonicalize(payload)
  return keccak256(toUtf8Bytes(canon)) as `0x${string}`
}

export function hashUtf8(input: string): string {
  return sha256(toUtf8Bytes(input))
}

export function hashJson(obj: any): string {
  return sha256(toUtf8Bytes(JSON.stringify(obj)))
}
