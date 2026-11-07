'use client'

import { useState } from 'react'
import { ArrowRight, CircleCheck, ExternalLink, LoaderCircle, Pill, ScanBarcode, X } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { PageHeader, Panel } from '@/components/dashboard/ui'
import { QrScanner } from '@/components/qr-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { send } from '@/lib/api'
import { formatDateTime, shortHash, txUrl } from '@/lib/format'
import { parseScanned } from '@/lib/qr'

type Scanned = { batchId: string; code: string }
type Sale = Scanned & { txHash: string; at: string; remaining: number }

export default function SellPage() {
  return (
    <RoleGate roles={['PHARMACY']}>
      <Sell />
    </RoleGate>
  )
}

function Sell() {
  const [pending, setPending] = useState<Scanned | null>(null)
  const [busy, setBusy] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [manualError, setManualError] = useState<string | null>(null)

  function take(text: string) {
    const qr = parseScanned(text)
    if (qr) setPending(qr)
    return !!qr
  }

  async function confirm() {
    if (!pending) return
    setBusy(true)
    try {
      const res = await send<{ data: { txHash: string; soldAt: string; remaining: number } }>('POST', '/custody/sell', pending)
      setSales((s) => [{ ...pending, txHash: res.data.txHash, at: res.data.soldAt, remaining: res.data.remaining }, ...s])
      toast.success('Pack marked as sold', { description: 'A later scan of this code will show it was sold.' })
      setPending(null)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Sell a pack" description="Scan the pack at the counter. Marking it sold is recorded on-chain, so a copied label shows up later." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-4">
          <Panel className="p-3">
            <QrScanner onResult={take} paused={!!pending || busy} />
          </Panel>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const ok = take(String(new FormData(e.currentTarget).get('code') ?? ''))
              setManualError(ok ? null : "That doesn't look like a DawaCheck code.")
            }}
            className="flex gap-2"
          >
            <Input name="code" placeholder="Or paste the label link" className="h-10 bg-card font-mono text-xs" />
            <Button type="submit" size="icon-lg" variant="outline" aria-label="Use code">
              <ArrowRight />
            </Button>
          </form>
          {manualError && <p className="text-sm text-red-600">{manualError}</p>}
        </div>

        <div className="space-y-6">
          {pending ? (
            <Panel className="p-6 ring-2 ring-sky-500/40">
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15 animate-pop">
                  <Pill className="size-5" />
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => setPending(null)} aria-label="Cancel">
                  <X />
                </Button>
              </div>
              <p className="mt-4 text-lg font-semibold">Pack scanned</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Batch</dt>
                  <dd className="font-mono text-xs">{shortHash(pending.batchId)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pack code</dt>
                  <dd className="font-mono text-xs">{pending.code}</dd>
                </div>
              </dl>
              <Button onClick={confirm} disabled={busy} className="mt-6 h-11 w-full">
                {busy ? <LoaderCircle className="animate-spin" /> : <CircleCheck />}
                {busy ? 'Recording on-chain…' : 'Mark as sold'}
              </Button>
            </Panel>
          ) : (
            <Panel className="flex flex-col items-center px-6 py-12 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <ScanBarcode className="size-5" />
              </span>
              <p className="mt-4 font-medium">Waiting for a pack</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Hold the QR label in front of the camera, then confirm the sale.</p>
            </Panel>
          )}

          {sales.length > 0 && (
            <Panel title="Sold this session">
              <ul className="divide-y">
                {sales.map((s) => (
                  <li key={s.txHash} className="flex items-center gap-4 px-5 py-3.5 animate-rise">
                    <CircleCheck className="size-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs">{s.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(s.at)} · {s.remaining.toLocaleString()} left of this batch
                      </p>
                    </div>
                    <a href={txUrl(s.txHash)} target="_blank" rel="noreferrer" aria-label="View transaction" className="text-sky-700">
                      <ExternalLink className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}
