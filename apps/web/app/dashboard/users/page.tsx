'use client'

import { useState } from 'react'
import { Building2, Factory, Search, Store, Truck, Users } from 'lucide-react'
import { ORG_LABEL } from '@/components/dashboard/nav'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, ListState, PageHeader, Panel, StatCard } from '@/components/dashboard/ui'
import { OrgStatusBadge } from '@/components/status-badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/lib/auth'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { AppUser, OrgType } from '@/lib/types'

const TABS: (OrgType | 'ALL')[] = ['ALL', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR']
const TYPE_ICON = { MANUFACTURER: Factory, DISTRIBUTOR: Truck, PHARMACY: Store, REGULATOR: Building2 }

export default function UsersPage() {
  return (
    <RoleGate roles={['REGULATOR']}>
      <UserList />
    </RoleGate>
  )
}

function UserList() {
  const { me } = useAuth()
  const users = useApi<{ data: AppUser[] }>('/users/all')
  const [tab, setTab] = useState<(typeof TABS)[number]>('ALL')
  const [q, setQ] = useState('')

  const all = users.data?.data
  const count = (t: OrgType) => all?.filter((u) => u.organization.type === t).length ?? 0
  const rows = all?.filter(
    (u) =>
      (tab === 'ALL' || u.organization.type === tab) &&
      `${u.email} ${u.organization.name} ${u.organization.city}`.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <>
      <PageHeader title="Users" description="Every account on the platform and the organisation it signs in for." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Manufacturers" value={all ? count('MANUFACTURER') : '—'} Icon={Factory} tone="sky" />
        <StatCard label="Distributors" value={all ? count('DISTRIBUTOR') : '—'} Icon={Truck} tone="amber" delay={60} />
        <StatCard label="Pharmacies" value={all ? count('PHARMACY') : '—'} Icon={Store} tone="green" delay={120} />
        <StatCard label="Total accounts" value={all ? all.length : '—'} Icon={Users} tone="slate" delay={180} />
      </div>

      <Panel delay={240}>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'ALL' ? 'All' : ORG_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, organisation, city" className="pl-9" />
          </div>
        </div>

        <ListState {...users} data={rows} empty={<EmptyState Icon={Users} title="No users match" />}>
          {(list) => (
            <ul className="divide-y">
              {list.map((u) => {
                const Icon = TYPE_ICON[u.organization.type]
                return (
                  <li key={u.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800 uppercase">
                        {u.email.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex min-w-0 items-center gap-2 font-medium">
                          <span className="truncate">{u.email}</span>
                          {u.id === me?.id && (
                            <span className="shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                              You
                            </span>
                          )}
                        </p>
                        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {u.organization.name} · {u.organization.city}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-14 sm:pl-0">
                      {u.organization.type !== 'REGULATOR' && <OrgStatusBadge status={u.organization.status} />}
                      <span className="text-xs whitespace-nowrap text-muted-foreground">Joined {formatDate(u.createdAt)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ListState>
      </Panel>
    </>
  )
}
