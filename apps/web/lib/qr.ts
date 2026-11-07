const BATCH_ID = /^0x[0-9a-fA-F]{64}$/

/** `<batchId>.<code>`: the batch id never contains a dot, so split on the first one. */
export function parseQr(raw: string): { batchId: string; code: string } | null {
  const value = decodeURIComponent(raw).trim()
  const dot = value.indexOf('.')
  if (dot <= 0 || dot === value.length - 1) return null
  return { batchId: value.slice(0, dot), code: value.slice(dot + 1) }
}

/**
 * Accepts what a scanner or a person pastes: the full label URL
 * (https://…/v/0xabc….K7P9) or just the `0xabc….K7P9` part.
 */
export function parseScanned(text: string): { batchId: string; code: string } | null {
  let value = text.trim()
  const marker = value.lastIndexOf('/v/')
  if (marker !== -1) value = value.slice(marker + 3)
  value = value.split(/[?#]/)[0]

  const parsed = parseQr(value)
  return parsed && BATCH_ID.test(parsed.batchId) ? parsed : null
}
