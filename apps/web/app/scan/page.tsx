'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Keyboard } from 'lucide-react'
import { Brand } from '@/components/brand'
import { QrScanner } from '@/components/qr-scanner'
import { Backdrop } from '@/components/verify/backdrop'
import { TONES } from '@/components/verify/verdict-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseScanned } from '@/lib/qr'

export default function ScanPage() {
  const router = useRouter()
  const [found, setFound] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  function open(text: string): boolean {
    const qr = parseScanned(text)
    if (!qr) return false
    setFound(true)
    router.push(`/v/${qr.batchId}.${qr.code}`)
    return true
  }

  function onManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = String(new FormData(e.currentTarget).get('code') ?? '')
    setManualError(open(text) ? null : "That doesn't look like a DawaCheck code.")
  }

  return (
    <main className="relative isolate min-h-dvh overflow-hidden">
      <Backdrop tone={TONES.neutral} />

      <div className="mx-auto max-w-md px-4 py-8 lg:max-w-5xl lg:px-8 lg:py-14">
        <header className="mb-8 flex items-center justify-between animate-rise">
          <Brand />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft />
              Home
            </Link>
          </Button>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="mb-6 animate-rise lg:mb-0">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand-700 uppercase">Verify a medicine</p>
            <h1 className="mt-3 font-display text-[2.6rem] leading-[1.02] text-brand-950 lg:text-6xl">
              Point your camera at the QR on the pack.
            </h1>
            <p className="mt-3 text-muted-foreground lg:text-lg">
              We check the code against the blockchain and its scan history. Nothing to install, no account.
            </p>

            <ol className="mt-8 hidden space-y-3 text-sm text-muted-foreground lg:block">
              {['Hold the pack steady inside the frame', 'Allow location if asked: it helps catch copied labels', 'Read the verdict and the pack’s journey'].map(
                (t, i) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-brand-800 text-xs font-semibold text-mint">{i + 1}</span>
                    {t}
                  </li>
                ),
              )}
            </ol>
          </div>

          <div className="space-y-4 animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="rounded-3xl bg-card/80 p-3 shadow-lift ring-1 ring-ink-900/[0.06] backdrop-blur-md">
              <QrScanner onResult={open} paused={found} />
              <p className="py-3 text-center text-sm text-muted-foreground">
                {found ? 'Code found, opening…' : 'Looking for a QR code…'}
              </p>
            </div>

            <form onSubmit={onManual} className="rounded-2xl bg-card/85 p-4 shadow-panel ring-1 ring-ink-900/[0.06] backdrop-blur-md">
              <label htmlFor="code" className="flex items-center gap-2 text-sm font-medium">
                <Keyboard className="size-4 text-muted-foreground" />
                No camera? Paste the link or code
              </label>
              <div className="mt-3 flex gap-2">
                <Input id="code" name="code" placeholder="https://…/v/0x….XXXX" className="font-mono text-xs" />
                <Button type="submit" size="icon" aria-label="Verify">
                  <ArrowRight />
                </Button>
              </div>
              {manualError && <p className="mt-2 text-sm text-red-600">{manualError}</p>}
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
