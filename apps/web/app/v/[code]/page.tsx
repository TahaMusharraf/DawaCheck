'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CircleAlert, RotateCw } from 'lucide-react'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Backdrop } from '@/components/verify/backdrop'
import { JourneyTimeline } from '@/components/verify/journey-timeline'
import { ProductCard } from '@/components/verify/product-card'
import { TONES, VERDICT_UI } from '@/components/verify/verdict-config'
import { VerdictHero } from '@/components/verify/verdict-hero'
import { VerifyLoading } from '@/components/verify/verify-loading'
import { api } from '@/lib/api'
import { parseQr } from '@/lib/qr'
import { getDeviceId, getLocation } from '@/lib/scan-context'
import type { VerifyResponse } from '@/lib/types'

export default function VerifyPage() {
  const { code: raw } = useParams<{ code: string }>()
  const qr = parseQr(raw)

  const [result, setResult] = useState<VerifyResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Every request logs a scan. StrictMode runs effects twice in dev, and a second
  // scan from the same device would feed clone detection a false signal.
  const started = useRef(false)

  useEffect(() => {
    if (!qr || started.current) return
    started.current = true

    async function run(batchId: string, code: string) {
      const location = await getLocation()
      const query = new URLSearchParams()
      if (location) {
        query.set('lat', String(location.lat))
        query.set('lng', String(location.lng))
      }

      try {
        const res = await api<VerifyResponse>(
          `/batches/verify/${batchId}/${encodeURIComponent(code)}?${query}`,
          { headers: { 'x-device-id': getDeviceId() } },
        )
        setResult(res.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    }

    void run(qr.batchId, qr.code)
  }, [qr])

  const tone = result ? VERDICT_UI[result.verdict].tone : TONES.neutral

  return (
    <main className="relative isolate min-h-dvh overflow-hidden">
      <Backdrop tone={tone} />

      <div className="mx-auto max-w-md px-4 py-8 lg:max-w-5xl lg:px-8 lg:py-14">
        <header className="mb-6 flex items-center justify-between animate-rise lg:mb-10">
          <Brand />
          <span className="text-xs text-muted-foreground">Medicine verification</span>
        </header>

        {result?.batch ? (
          // Desktop: verdict pinned on the left, details scroll on the right. Phone: one column.
          <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-6 lg:space-y-0">
            <div className="lg:sticky lg:top-8">
              <VerdictHero verdict={result.verdict} risk={result.risk} />
            </div>
            <div className="space-y-4 lg:space-y-6">
              <ProductCard batch={result.batch} manufacturer={result.manufacturer} />
              {result.journey && result.journey.length > 0 && <JourneyTimeline steps={result.journey} />}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md lg:pt-6">
            {!qr ? (
              <ErrorCard title="This isn't a DawaCheck code" message="The QR code could not be read. Scan the label on the pack again." />
            ) : error ? (
              <ErrorCard title="Couldn't verify this pack" message={error} retry />
            ) : result ? (
              <VerdictHero verdict={result.verdict} risk={result.risk} />
            ) : (
              <VerifyLoading />
            )}
          </div>
        )}

        <p className="pt-8 text-center text-xs text-muted-foreground animate-rise lg:pt-12" style={{ animationDelay: '600ms' }}>
          Checked against a public blockchain. No app or account needed.
        </p>
      </div>
    </main>
  )
}

function ErrorCard({ title, message, retry }: { title: string; message: string; retry?: boolean }) {
  return (
    <section className="rounded-2xl bg-card/80 p-6 text-center shadow-sm ring-1 ring-foreground/10 backdrop-blur animate-rise">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-600 animate-pop">
        <CircleAlert className="size-7" strokeWidth={1.75} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {retry && (
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          <RotateCw />
          Try again
        </Button>
      )}
    </section>
  )
}
