'use client'

import { useState } from 'react'
import { Activity, MapPinned, PackageCheck, ScanLine, ShieldX } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, Segmented, StatCard, StatStrip } from '@/components/dashboard/ui'
import { VERDICT_UI } from '@/components/verify/verdict-config'
import { humanize } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { AlertStatus, HeatmapRow, Overview, OrgStatus, OrgType, Verdict } from '@/lib/types'

const VERDICTS: Verdict[] = ['AUTHENTIC', 'NOT_REGISTERED', 'CLONE_SUSPECTED', 'RECALLED', 'EXPIRED']
const RANGES = [7, 30, 90] as const

export default function AnalyticsPage() {
  return (
    <RoleGate roles={['REGULATOR']}>
      <Analytics />
    </RoleGate>
  )
}

function Analytics() {
  const overview = useApi<Overview>('/analytics')
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const heatmap = useApi<{ scans: HeatmapRow[] }>(`/analytics/heatmap?days=${days}`)
  const o = overview.data

  const scanCount = (v: Verdict) => o?.scans.find((s) => s.result === v)?._count._all ?? 0
  const totalScans = o ? o.scans.reduce((a, s) => a + s._count._all, 0) : undefined
  const bad = totalScans !== undefined ? totalScans - scanCount('AUTHENTIC') : undefined
  const sold = o?.units.find((u) => u.status === 'SOLD')?._count._all
  const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

  return (
    <>
      <PageHeader title="Scan Radar" description="Every scan across the country: what is being checked, where, and where counterfeits surface." />

      {overview.error && !o ? (
        <Panel>
          <ErrorState message={overview.error} onRetry={overview.reload} />
        </Panel>
      ) : (
        <>
          <StatStrip>
            <StatCard label="Total scans" Icon={ScanLine} value={totalScans?.toLocaleString() ?? '—'} />
            <StatCard
              label="Genuine on scan"
              Icon={PackageCheck}
              tone="green"
              delay={60}
              value={totalScans === undefined ? '—' : `${pct(scanCount('AUTHENTIC'), totalScans)}%`}
              hint={totalScans ? `${scanCount('AUTHENTIC').toLocaleString()} authentic scans` : undefined}
            />
            <StatCard label="Problem scans" Icon={ShieldX} tone="red" delay={120} value={bad?.toLocaleString() ?? '—'} hint="Not authentic, for any reason" />
            <StatCard label="Packs sold" Icon={Activity} tone="slate" delay={180} value={sold?.toLocaleString() ?? '—'} />
          </StatStrip>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Scan results" description="Every verification, by verdict." delay={200}>
              {!o ? (
                <ListSkeleton rows={5} />
              ) : (
                <ul className="space-y-4 p-5">
                  {VERDICTS.map((v) => {
                    const { eyebrow, Icon, tone } = VERDICT_UI[v]
                    const count = scanCount(v)
                    return (
                      <li key={v} title={`${eyebrow}: ${count.toLocaleString()} scans`} className="group">
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Icon className={cn('size-4', tone.text)} />
                            {eyebrow}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            <span className="font-medium text-foreground">{count.toLocaleString()}</span> · {pct(count, totalScans ?? 0)}%
                          </span>
                        </div>
                        <Bar value={count} max={totalScans ?? 0} className={tone.solid} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="Problem scans by city"
              description="Scans that were not authentic."
              delay={260}
              action={
                <Segmented size="sm" options={RANGES} value={days} onChange={setDays} label={(r) => `${r}d`} />
              }
            >
              <CityBars rows={heatmap.loading ? undefined : heatmap.data?.scans} error={heatmap.error} />
            </Panel>

            <Panel title="Organisations" description="By role and licence status." delay={320}>
              {!o ? <ListSkeleton rows={3} /> : <OrgTable rows={o.orgs} />}
            </Panel>

            <Panel title="Alerts" description="Counterfeit alerts by where they are in review." delay={380}>
              {!o ? (
                <ListSkeleton rows={4} />
              ) : (
                <dl className="grid grid-cols-2 gap-px bg-ink-900/[0.06]">
                  {(['OPEN', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED'] as AlertStatus[]).map((s) => (
                    <div key={s} className="bg-card p-5">
                      <dt className="text-sm text-muted-foreground">{humanize(s)}</dt>
                      <dd className="mt-1 font-display text-4xl leading-none text-brand-950 tabular-nums">
                        {(o.alerts.find((a) => a.status === s)?._count._all ?? 0).toLocaleString()}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  )
}

/** A thin bar with a rounded data-end, growing from the left. */
function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const width = max ? Math.max((value / max) * 100, value ? 1.5 : 0) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
      <div
        className={cn('h-full origin-left rounded-full animate-grow-x transition-[width,opacity] duration-700 ease-out group-hover:opacity-80', className)}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

function CityBars({ rows, error }: { rows?: HeatmapRow[]; error?: string }) {
  if (error && !rows) return <ErrorState message={error} />
  if (!rows) return <ListSkeleton rows={4} />
  if (rows.length === 0) {
    return (
      <EmptyState
        Icon={MapPinned}
        title="No problem scans with a city"
        description="Only scans that sent a city are counted. Scans with GPS but no city name don't appear here yet."
      />
    )
  }
  const sorted = [...rows].sort((a, b) => b._count._all - a._count._all).slice(0, 8)
  const max = sorted[0]._count._all
  return (
    <ul className="space-y-4 p-5">
      {sorted.map((r) => (
        <li
          key={r.city}
          className="group"
          title={`${r.city}: ${r._count._all} problem scans${r._avg.lat !== null ? ` · around ${r._avg.lat.toFixed(2)}, ${r._avg.lng?.toFixed(2)}` : ''}`}
        >
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span>{r.city}</span>
            <span className="font-medium tabular-nums">{r._count._all.toLocaleString()}</span>
          </div>
          <Bar value={r._count._all} max={max} className="bg-gradient-to-r from-red-400 to-red-600" />
        </li>
      ))}
    </ul>
  )
}

function OrgTable({ rows }: { rows: Overview['orgs'] }) {
  const types: OrgType[] = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY']
  const statuses: OrgStatus[] = ['LICENSED', 'PENDING', 'REVOKED']
  const get = (t: OrgType, s: OrgStatus) => rows.find((r) => r.type === t && r.status === s)?._count._all ?? 0
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-50/70 text-left text-[11px] tracking-[0.08em] text-ink-500 uppercase">
            <th className="px-5 py-3 font-medium">Role</th>
            {statuses.map((s) => (
              <th key={s} className="px-5 py-3 text-right font-medium">
                {humanize(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/[0.05] border-t border-ink-900/[0.06]">
          {types.map((t) => (
            <tr key={t} className="transition-colors hover:bg-brand-50/50">
              <td className="px-5 py-3 font-medium">{humanize(t)}</td>
              {statuses.map((s) => (
                <td key={s} className="px-5 py-3 text-right tabular-nums">
                  {get(t, s).toLocaleString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
