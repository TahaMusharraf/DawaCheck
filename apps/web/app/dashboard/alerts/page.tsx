'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, MapPin, PackageCheck, Siren } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, ListState, PageHeader, Panel } from '@/components/dashboard/ui'
import { AlertStatusBadge } from '@/components/status-badge'
import { formatDateTime, humanize } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { Alert, AlertStatus } from '@/lib/types'

const TABS: (AlertStatus | 'ALL')[] = ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED', 'ALL']

export default function AlertsPage() {
  return (
    <RoleGate roles={['REGULATOR']}>
      <Alerts />
    </RoleGate>
  )
}

function Alerts() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('OPEN')
  const alerts = useApi<{ alerts: Alert[] }>(tab === 'ALL' ? '/alerts' : `/alerts?status=${tab}`)

  return (
    <>
      <PageHeader title="Counterfeit alerts" description="Raised when a genuine code's scan history looks like a copied label." />

      <Panel>
        <div className="border-b p-4">
          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'ALL' ? 'All' : humanize(t)}
              </button>
            ))}
          </div>
        </div>

        <ListState
          {...alerts}
          data={alerts.loading ? undefined : alerts.data?.alerts}
          empty={<EmptyState Icon={PackageCheck} title="No alerts here" description={tab === 'OPEN' ? 'Nothing suspicious right now.' : undefined} />}
        >
          {(rows) => (
            <ul className="divide-y">
              {rows.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/alerts/${a.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-600/20">
                      <Siren className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {a.batch.drugName} <span className="font-normal text-muted-foreground">· {a.batch.batchNumber}</span>
                      </p>
                      <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        <span>{humanize(a.ruleTriggered)}</span>
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="size-3" />
                          {a.city ?? 'Unknown'}
                        </span>
                        <span>{formatDateTime(a.createdAt)}</span>
                      </p>
                    </div>
                    <span className="hidden text-right sm:block">
                      <span className="block text-sm font-semibold tabular-nums">{a.severity}</span>
                      <span className="block text-xs text-muted-foreground">risk</span>
                    </span>
                    <AlertStatusBadge status={a.status} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ListState>
      </Panel>
    </>
  )
}
