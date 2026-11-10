'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, CircleX, LoaderCircle, MapPin, Search, ShieldX, Siren } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { ErrorState, IconTile, Panel, RiskMeter } from '@/components/dashboard/ui'
import { RuleChips } from '@/components/dashboard/rule-chips'
import { AlertStatusBadge, Pill } from '@/components/status-badge'
import { VERDICT_UI } from '@/components/verify/verdict-config'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { send } from '@/lib/api'
import { formatDateTime, humanize, shortHash } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { AlertDetail, AlertStatus } from '@/lib/types'

// Mirrors the API's allowed moves; a closed alert has no actions.
const NEXT: Record<AlertStatus, AlertStatus[]> = {
  OPEN: ['INVESTIGATING', 'CONFIRMED', 'DISMISSED'],
  INVESTIGATING: ['CONFIRMED', 'DISMISSED'],
  CONFIRMED: [],
  DISMISSED: [],
}

const ACTION = {
  INVESTIGATING: { label: 'Start investigating', Icon: Search, variant: 'outline' as const },
  CONFIRMED: { label: 'Confirm counterfeit', Icon: ShieldX, variant: 'destructive' as const },
  DISMISSED: { label: 'Dismiss', Icon: CircleX, variant: 'ghost' as const },
}

export default function AlertDetailPage() {
  return (
    <RoleGate roles={['REGULATOR']}>
      <AlertDetailView />
    </RoleGate>
  )
}

function AlertDetailView() {
  const { id } = useParams<{ id: string }>()
  const alert = useApi<{ alert: AlertDetail }>(`/alerts/${id}`)
  const [busy, setBusy] = useState<AlertStatus | null>(null)
  const a = alert.data?.alert

  async function move(status: AlertStatus) {
    setBusy(status)
    try {
      await send('PATCH', `/alerts/${id}`, { status })
      toast.success(`Alert marked ${humanize(status).toLowerCase()}`)
      alert.reload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
        <Link href="/dashboard/alerts">
          <ArrowLeft />
          Alerts
        </Link>
      </Button>

      {alert.error && !a ? (
        <Panel>
          <ErrorState message={alert.error} onRetry={alert.reload} />
        </Panel>
      ) : !a ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 animate-rise lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <IconTile Icon={Siren} tone="red" size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-brand-950 lg:text-[2rem]">{a.batch.drugName}</h1>
                  <AlertStatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Batch <span className="font-mono">{a.batch.batchNumber}</span> by {a.batch.manufacturer.name}
                </p>
                <div className="mt-2">
                  <RuleChips rules={a.ruleTriggered} />
                </div>
              </div>
            </div>
            {NEXT[a.status].length > 0 && (
              <div className="flex flex-wrap gap-2">
                {NEXT[a.status].map((s) => {
                  const { label, Icon, variant } = ACTION[s as keyof typeof ACTION]
                  return (
                    <Button key={s} variant={variant} onClick={() => move(s)} disabled={busy !== null}>
                      {busy === s ? <LoaderCircle className="animate-spin" /> : <Icon />}
                      {label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <Panel title="Summary" className="h-fit" delay={80}>
              <dl className="divide-y divide-ink-900/[0.05] text-sm">
                <Row label="Risk score" value={<RiskMeter value={a.severity} />} />
                <Row label="City" value={a.city ?? 'Unknown'} />
                <Row label="Raised" value={formatDateTime(a.createdAt)} />
                <Row label="Closed" value={formatDateTime(a.resolvedAt)} />
                <Row label="Scans of this pack" value={a.unit.scans.length} />
                <Row label="Pack" value={<span className="font-mono text-xs">{shortHash(a.unitHash)}</span>} />
              </dl>
            </Panel>

            <Panel title="Scan history" description="Every scan of this one pack, oldest first." delay={160}>
              <ol className="relative px-5 py-5">
                <span aria-hidden className="absolute top-8 bottom-8 left-[2.15rem] w-px origin-top bg-gradient-to-b from-ink-200 via-ink-200 to-transparent animate-grow-y" />
                {a.unit.scans.map((s, i) => {
                  const ui = VERDICT_UI[s.result]
                  return (
                    <li key={i} className="relative flex gap-4 pb-5 last:pb-0 animate-rise" style={{ animationDelay: `${200 + i * 60}ms` }}>
                      <span className={cn('relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-1', ui.tone.soft, ui.tone.ring)}>
                        <ui.Icon className={cn('size-4', ui.tone.text)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{ui.eyebrow}</p>
                          <time className="text-xs text-muted-foreground">{formatDateTime(s.scannedAt)}</time>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {s.city ?? (s.lat !== null ? `${s.lat.toFixed(2)}, ${s.lng?.toFixed(2)}` : 'No location')}
                          <span className="mx-1">·</span>
                          risk {s.riskScore}
                        </p>
                        {s.riskFlags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {s.riskFlags.map((f) => (
                              <Pill key={f} tone="amber">
                                {humanize(f)}
                              </Pill>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Panel>
          </div>
        </>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-ink-50/60">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
