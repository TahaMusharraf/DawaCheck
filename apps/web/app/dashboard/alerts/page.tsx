'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Clock, Hash, MapPin, PackageCheck, Siren } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { RuleChips } from '@/components/dashboard/rule-chips'
import { EmptyState, IconTile, ListHead, ListState, Meta, PageHeader, Panel, RiskMeter, Segmented, Toolbar } from '@/components/dashboard/ui'
import { AlertStatusBadge } from '@/components/status-badge'
import { formatDateTime, humanize } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Alert, AlertStatus } from '@/lib/types'

const TABS: (AlertStatus | 'ALL')[] = ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED', 'ALL']
const COLS = 'minmax(0,1.6fr) minmax(0,1.6fr) 7rem 8.5rem 6.5rem 7rem 1rem'

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
        <Toolbar>
          <Segmented options={TABS} value={tab} onChange={setTab} label={(t) => (t === 'ALL' ? 'All' : humanize(t))} />
        </Toolbar>

        <ListState
          {...alerts}
          data={alerts.loading ? undefined : alerts.data?.alerts}
          empty={<EmptyState Icon={PackageCheck} title="No alerts here" description={tab === 'OPEN' ? 'Nothing suspicious right now.' : undefined} />}
        >
          {(rows) => (
            <>
              <ListHead cols={COLS}>
                <span>Medicine</span>
                <span>Triggered by</span>
                <span>City</span>
                <span>Raised</span>
                <span>Risk</span>
                <span>Status</span>
                <span />
              </ListHead>
              <ul className="stagger divide-y divide-ink-900/[0.05]">
                {rows.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/alerts/${a.id}`}
                      style={{ '--cols': COLS } as React.CSSProperties}
                      className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors duration-200 hover:bg-brand-50/60 md:grid md:grid-cols-[var(--cols)]"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <IconTile Icon={Siren} tone="red" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand-950">{a.batch.drugName}</p>
                          <p className="mt-0.5 text-[13px] text-muted-foreground">
                            <Meta Icon={Hash}>{a.batch.batchNumber}</Meta>
                          </p>
                        </div>
                      </div>
                      <div className="order-last w-full pl-[3.6rem] md:order-none md:w-auto md:pl-0">
                        <RuleChips rules={a.ruleTriggered} />
                        <p className="mt-1.5 flex gap-3 text-[13px] text-muted-foreground md:hidden">
                          <Meta Icon={MapPin}>{a.city ?? 'Unknown'}</Meta>
                          <Meta Icon={Clock}>{formatDateTime(a.createdAt)}</Meta>
                        </p>
                      </div>
                      <span className="hidden text-sm text-ink-600 md:block">
                        <Meta Icon={MapPin}>{a.city ?? 'Unknown'}</Meta>
                      </span>
                      <span className="hidden text-[13px] text-ink-600 md:block">{formatDateTime(a.createdAt)}</span>
                      <span className="hidden md:block">
                        <RiskMeter value={a.severity} />
                      </span>
                      <span>
                        <AlertStatusBadge status={a.status} />
                      </span>
                      <ChevronRight className="hidden size-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600 md:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ListState>
      </Panel>
    </>
  )
}
