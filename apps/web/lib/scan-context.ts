// Browser-only helpers for the scan request. Call them from effects, never during render.

const DEVICE_KEY = 'deviceId'

/** A random id kept in localStorage, so clone detection can tell devices apart. */
export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY)
    if (saved) return saved

    // randomUUID only exists on https/localhost; a phone on the LAN IP gets the fallback.
    // getRandomValues is available everywhere, unlike randomUUID.
    const id =
      crypto.randomUUID?.() ??
      Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return 'unknown'
  }
}

/** Resolves to null instead of rejecting: a scan must still work without location. */
export function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)

    // The browser's own timeout doesn't count the time the permission prompt is open.
    const fallback = setTimeout(() => resolve(null), 8000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallback)
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        clearTimeout(fallback)
        resolve(null)
      },
      { timeout: 5000, maximumAge: 60_000 },
    )
  })
}
