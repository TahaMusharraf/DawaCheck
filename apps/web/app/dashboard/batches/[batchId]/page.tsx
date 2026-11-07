'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Blocks, Download, ExternalLink, LoaderCircle, Pill, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { RecallDialog } from '@/components/dashboard/recall-dialog'
import { EmptyState, ErrorState, ListState, Panel } from '@/components/dashboard/ui'
import { BatchStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { download } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatDate, formatDateTime, humanize, shortHash, txUrl } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Batch, CustodyEvent } from '@/lib/types'

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const { me } = useAuth()
  const batch = useApi<{ data: Batch }>(`/batches/${batchId}`)
  const history = useApi<{ events: CustodyEvent[] }>(`/custody/batch/${batchId}`)
  const [busy, setBusy] = useState(false)
  const b = batch.data?.data

  const isOwner = me?.org.type === 'MANUFACTURER' && b?.manufacturer.id === me.org.id
  const canRecall = b && !b.recalled && (me?.org.type === 'REGULATOR' || isOwner)

  async function labels() {
    if (!b) return
    setBusy(true)
    try {
      await download(`/batches/${b.batchId}/labels`, `labels-${b.batchNumber}.pdf`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
        <Link href="/dashboard/batches">
          <ArrowLeft />
          Batches
        </Link>
      </Button>

      {batch.error && !b ? (
        <Panel>
          <ErrorState message={batch.error} onRetry={batch.reload} />
        </Panel>
      ) : !b ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 animate-rise sm:flex-row sm:items-end sm:justify-between lg:mb-8">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15">
                <Pill className="size-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{b.drugName}</h1>
                  <BatchStatusBadge recalled={b.recalled} expiryDate={b.expiryDate} />
                </div>
                <p className="text-muted-foreground">
                  {b.dosage} · {b.batchNumber} · {b.manufacturer.name}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Button variant="outline" onClick={labels} disabled={busy}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <Download />}
                  QR labels
                </Button>
              )}
              {isOwner && !b.recalled && (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/dispatch?batch=${b.batchId}`}>
                    <Truck />
                    Dispatch
                  </Link>
                </Button>
              )}
              {canRecall && <RecallDialog batchId={b.batchId} label={b.batchNumber} onDone={batch.reload} />}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            <Panel title="Details" className="h-fit" delay={80}>
              <dl className="divide-y text-sm">
                <Row label="Packs" value={b.quantity.toLocaleString()} />
                <Row label="Manufactured" value={formatDate(b.mfgDate)} />
                <Row label="Expires" value={formatDate(b.expiryDate)} />
                <Row label="Registered" value={formatDateTime(b.createdAt)} />
                <Row label="On-chain ID" value={<span className="font-mono text-xs">{shortHash(b.batchId)}</span>} />
                {b.txHash && (
                  <Row
                    label="Transaction"
                    value={
                      <a href={txUrl(b.txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                        <span className="font-mono text-xs">{shortHash(b.txHash)}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    }
                  />
                )}
              </dl>
            </Panel>

            <Panel title="Custody history" description="Each handover is an on-chain transfer." delay={160}>
              <ListState
                {...history}
                data={history.data?.events}
                empty={<EmptyState Icon={Blocks} title="Still at the factory" description="No custody transfers yet. Dispatch stock to a distributor to start the journey." />}
              >
                {(events) => (
                  <ol className="divide-y">
                    {events.map((e) => (
                      <li key={e.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                          <OrgChip name={e.fromOrg.name} type={e.fromOrg.type} />
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                          <OrgChip name={e.toOrg.name} type={e.toOrg.type} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground sm:justify-end">
                          <span className="font-medium text-foreground tabular-nums">{e.quantity.toLocaleString()} packs</span>
                          <span>{formatDateTime(e.occurredAt)}</span>
                          <a href={txUrl(e.txHash)} target="_blank" rel="noreferrer" aria-label="View transaction" className="text-sky-700">
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </ListState>
            </Panel>
          </div>
        </>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function OrgChip({ name, type }: { name: string; type: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate font-medium">{name}</span>
      <span className="block text-xs text-muted-foreground">{humanize(type)}</span>
    </span>
  )
}
