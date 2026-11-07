const dateFormat = new Intl.DateTimeFormat('en-PK', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}

const dateTimeFormat = new Intl.DateTimeFormat('en-PK', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date)
}

/** 0x1234abcd…ef90 → 0x1234…ef90 */
export function shortHash(value: string): string {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}

/** IMPOSSIBLE_TRAVEL → Impossible travel */
export function humanize(value: string): string {
  const s = value.toLowerCase().replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date()
}

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://amoy.polygonscan.com'

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`
}

/** Today as yyyy-mm-dd, for <input type="date"> defaults. */
export function todayInput(offsetYears = 0): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + offsetYears)
  return d.toISOString().slice(0, 10)
}
