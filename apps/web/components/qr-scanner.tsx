'use client'

import { useEffect, useRef, useState } from 'react'
import { CameraOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Live camera QR reader. Calls onResult once per distinct code; set `paused`
 * while you handle a result so the same label isn't read again and again.
 */
export function QrScanner({
  onResult,
  paused = false,
  className,
}: {
  onResult: (text: string) => void
  paused?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onResultRef = useRef(onResult)
  const pausedRef = useRef(paused)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onResultRef.current = onResult
    pausedRef.current = paused
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // A fresh element per mount: StrictMode mounts twice, and two scanners
    // sharing one element would wipe each other's video on cleanup.
    const el = document.createElement('div')
    el.id = `qr-${Math.random().toString(36).slice(2)}`
    el.className = 'size-full'
    container.appendChild(el)

    let stop: (() => Promise<void>) | null = null
    let disposed = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (disposed) return
      const scanner = new Html5Qrcode(el.id, { verbose: false })
      const started = scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }) },
          (text) => {
            if (!pausedRef.current) onResultRef.current(text)
          },
          () => {},
        )
        .catch(() => {
          setError(
            window.isSecureContext
              ? 'Camera permission was denied or no camera was found.'
              : 'The camera only works over HTTPS. Open the deployed site, or paste the code below.',
          )
        })
      stop = () => started.then(() => (scanner.isScanning ? scanner.stop() : undefined)).catch(() => {})
    })

    return () => {
      disposed = true
      void (stop?.() ?? Promise.resolve()).finally(() => el.remove())
    }
  }, [])

  return (
    <div
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-950',
        '[&_video]:size-full! [&_video]:object-cover [&_#qr-shaded-region]:hidden!',
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {/* Viewfinder: four corners and a sweeping line. */}
      <div aria-hidden className="pointer-events-none absolute inset-[15%]">
        <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-t-4 border-l-4 border-white" />
        <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-t-4 border-r-4 border-white" />
        <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
        <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-r-4 border-b-4 border-white" />
        {!error && !paused && (
          <span className="absolute inset-x-3 top-2 h-0.5 rounded-full bg-sky-400 shadow-[0_0_14px_3px] shadow-sky-400/70 animate-scan-tall" />
        )}
      </div>

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center text-sm text-slate-200">
          <div>
            <CameraOff className="mx-auto mb-3 size-8 text-slate-400" />
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
