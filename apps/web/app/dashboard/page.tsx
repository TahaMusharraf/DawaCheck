'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Boxes,
  Building2,
  Hourglass,
  Inbox,
  PackageCheck,
  PackagePlus,
  ScanBarcode,
  ShieldAlert,
  Siren,
  Truck,
  Warehouse,
} from 'lucide-react'
import { BatchRow, HoldingRow } from '@/components/dashboard/rows'
import { EmptyState, ListState, PageHeader, Panel, StatCard } from '@/components/dashboard/ui'
import { AlertStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { formatDateTime, humanize } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Alert, Batch, Holding, Me, Organization, Overview, Recall } from '@/lib/types'

export default function DashboardHome() {
  const { me } = useAuth()
  if (!me) return null
  const greeting = `Welcome back, ${me.org.name}`

  switch (me.org.type) {
    case 'REGULATOR':
      return <RegulatorHome greeting={greeting} />
    case 'MANUFACTURER':
      return <ManufacturerHome greeting={greeting} />
    default:
      return <SupplyHome greeting={greeting} me={me} />
  }
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const n = (v: number | undefined) => (v === undefined ? '—' : v.toLocaleString())

function RegulatorHome({ greeting }: { greeting: string }) {
  const overview = useApi<Overview>('/analytics')
  const pending = useApi<{ data: Organization[] }>('/organization/getOrganization?status=PENDING')
  const alerts = useApi<{ alerts: Alert[] }>('/alerts?status=OPEN')
  const o = overview.data

  return (
    <>
      <PageHeader title={greeting} description="The national picture: who is licensed, what is moving, and what looks wrong." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Licensed organisations" Icon={Building2} tone="green" value={n(o && sum(o.orgs.filter((x) => x.status === 'LICENSED').map((x) => x._count._all)))} />
        <StatCard label="Pending applications" Icon={Hourglass} tone="amber" delay={60} value={n(pending.data?.data.length)} />
        <StatCard label="Batches registered" Icon={Boxes} delay={120} value={n(o?.batches)} hint={o ? `${o.recalls} recalled` : undefined} />
        <StatCard label="Open alerts" Icon={Siren} tone="red" delay={180} value={n(alerts.data?.alerts.length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Applications waiting"
          description="Approving writes the licence on-chain."
          delay={200}
          action={<SeeAll href="/dashboard/organizations" />}
        >
          <ListState
            {...pending}
            data={pending.data?.data}
            empty={<EmptyState Icon={Inbox} title="No pending applications" />}
          >
            {(rows) => (
              <ul className="divide-y">
                {rows.slice(0, 5).map((org) => (
                  <li key={org.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
                      <Building2 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{org.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {humanize(org.type)} · {org.city}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ListState>
        </Panel>

        <Panel title="Latest counterfeit alerts" description="Raised by clone detection." delay={260} action={<SeeAll href="/dashboard/alerts" />}>
          <ListState {...alerts} data={alerts.data?.alerts} empty={<EmptyState Icon={PackageCheck} title="No open alerts" description="Nothing suspicious right now." />}>
            {(rows) => (
              <ul className="divide-y">
                {rows.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/dashboard/alerts/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                      <span className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-600/20">
                        <Siren className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.batch.drugName}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {humanize(a.ruleTriggered)} · {a.city ?? 'Unknown city'} · {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                      <AlertStatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </ListState>
        </Panel>
      </div>
    </>
  )
}

function ManufacturerHome({ greeting }: { greeting: string }) {
  const batches = useApi<{ data: Batch[] }>('/batches/all')
  const holdings = useApi<{ data: Holding[] }>('/custody/custody/holdings')
  const recalls = useApi<{ recalls: Recall[] }>('/recalls')
  const b = batches.data?.data

  return (
    <>
      <PageHeader
        title={greeting}
        description="Register batches, print labels and send stock down the chain."
        actions={
          <Button asChild>
            <Link href="/dashboard/batches/new">
              <PackagePlus />
              New batch
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Batches" Icon={Boxes} value={n(b?.length)} />
        <StatCard label="Packs issued" Icon={PackageCheck} tone="green" delay={60} value={n(b && sum(b.map((x) => x.quantity)))} />
        <StatCard label="Packs in your warehouse" Icon={Warehouse} tone="slate" delay={120} value={n(holdings.data && sum(holdings.data.data.map((h) => h.held)))} />
        <StatCard label="Recalled batches" Icon={ShieldAlert} tone="red" delay={180} value={n(recalls.data?.recalls.length)} />
      </div>

      <Panel title="Recent batches" className="mt-6" delay={200} action={<SeeAll href="/dashboard/batches" />}>
        <ListState
          {...batches}
          data={b}
          empty={
            <EmptyState
              Icon={Boxes}
              title="No batches yet"
              description="Register your first batch to generate its codes and QR labels."
              action={
                <Button asChild>
                  <Link href="/dashboard/batches/new">Register a batch</Link>
                </Button>
              }
            />
          }
        >
          {(rows) => (
            <ul className="divide-y">
              {rows.slice(0, 5).map((batch) => (
                <BatchRow key={batch.batchId} batch={batch} />
              ))}
            </ul>
          )}
        </ListState>
      </Panel>
    </>
  )
}

function SupplyHome({ greeting, me }: { greeting: string; me: Me }) {
  const holdings = useApi<{ data: Holding[] }>('/custody/custody/holdings')
  const recalls = useApi<{ recalls: Recall[] }>('/recalls')
  const pharmacy = me.org.type === 'PHARMACY'
  const atRisk = recalls.data?.recalls.filter((r) => (r.held ?? 0) > 0) ?? []
  const h = holdings.data?.data

  return (
    <>
      <PageHeader
        title={greeting}
        description={pharmacy ? 'Receive stock, sell packs and act on recalls.' : 'Receive stock and dispatch it to pharmacies.'}
        actions={
          <Button asChild>
            <Link href={pharmacy ? '/dashboard/sell' : '/dashboard/dispatch'}>
              {pharmacy ? <ScanBarcode /> : <Truck />}
              {pharmacy ? 'Sell a pack' : 'Dispatch'}
            </Link>
          </Button>
        }
      />

      {atRisk.length > 0 && (
        <Link
          href="/dashboard/recalls"
          className="mb-6 flex items-center gap-4 rounded-2xl bg-red-50 p-5 text-red-800 ring-1 ring-red-600/20 animate-rise"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-600 text-white">
            <ShieldAlert className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">You hold stock from {atRisk.length === 1 ? 'a recalled batch' : `${atRisk.length} recalled batches`}</p>
            <p className="text-sm text-red-700">Take these packs off the shelf. Do not sell or dispatch them.</p>
          </div>
          <ArrowRight className="size-5 shrink-0" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Batches in stock" Icon={Boxes} value={n(h?.length)} />
        <StatCard label="Packs in stock" Icon={Warehouse} tone="green" delay={60} value={n(h && sum(h.map((x) => x.held)))} />
        <StatCard label="Recall alerts" Icon={ShieldAlert} tone={atRisk.length ? 'red' : 'slate'} delay={120} value={n(recalls.data ? atRisk.length : undefined)} />
      </div>

      <Panel title="In stock" className="mt-6" delay={200} action={<SeeAll href="/dashboard/inventory" />}>
        <ListState
          {...holdings}
          data={h}
          empty={<EmptyState Icon={Warehouse} title="Nothing in stock" description="Stock appears here once a supplier dispatches it to you on-chain." />}
        >
          {(rows) => (
            <ul className="divide-y">
              {rows.slice(0, 5).map((holding) => (
                <HoldingRow key={holding.batchId} holding={holding} />
              ))}
            </ul>
          )}
        </ListState>
      </Panel>
    </>
  )
}

function SeeAll({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>
        See all
        <ArrowRight />
      </Link>
    </Button>
  )
}
