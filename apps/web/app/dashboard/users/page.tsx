'use client'

import { useState } from 'react'
import { Building2, Factory, MapPin, Store, Truck, Users } from 'lucide-react'
import { ORG_LABEL } from '@/components/dashboard/nav'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, ListHead, ListState, Meta, PageHeader, Panel, SearchField, Segmented, StatCard, StatStrip, Toolbar } from '@/components/dashboard/ui'
import { OrgStatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/lib/auth'
import { useApi } from '@/lib/use-api'
import type { AppUser, OrgType } from '@/lib/types'

const TABS: (OrgType | 'ALL')[] = ['ALL', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR']
const TYPE_ICON = { MANUFACTURER: Factory, DISTRIBUTOR: Truck, PHARMACY: Store, REGULATOR: Building2 }
const COLS = 'minmax(0,1.6fr) minmax(0,1.5fr) 7rem 6.5rem 7.5rem'

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

      <StatStrip className="mb-6">
        <StatCard label="Manufacturers" value={all ? count('MANUFACTURER') : '—'} Icon={Factory} tone="sky" />
        <StatCard label="Distributors" value={all ? count('DISTRIBUTOR') : '—'} Icon={Truck} tone="amber" delay={60} />
        <StatCard label="Pharmacies" value={all ? count('PHARMACY') : '—'} Icon={Store} tone="green" delay={120} />
        <StatCard label="Total accounts" value={all ? all.length : '—'} Icon={Users} tone="slate" delay={180} />
      </StatStrip>

      <Panel delay={240}>
        <Toolbar>
          <Segmented options={TABS} value={tab} onChange={setTab} label={(t) => (t === 'ALL' ? 'All' : ORG_LABEL[t])} />
          <SearchField value={q} onChange={setQ} placeholder="Search email, organisation, city" />
        </Toolbar>

        <ListState {...users} data={rows} empty={<EmptyState Icon={Users} title="No users match" />}>
          {(list) => (
            <>
              <ListHead cols={COLS}>
                <span>Account</span>
                <span>Organisation</span>
                <span>City</span>
                <span>Licence</span>
                <span>Joined</span>
              </ListHead>
              <ul className="stagger divide-y divide-ink-900/[0.05]">
                {list.map((u) => {
                  const Icon = TYPE_ICON[u.organization.type]
                  const isMe = u.id === me?.id
                  return (
                    <li
                      key={u.id}
                      style={{ '--cols': COLS } as React.CSSProperties}
                      className="group flex flex-col gap-2 px-5 py-3.5 transition-colors duration-200 hover:bg-brand-50/50 md:grid md:grid-cols-[var(--cols)] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-mint text-sm font-semibold text-brand-800 uppercase ring-1 ring-brand-600/10 transition-transform duration-300 group-hover:scale-105">
                          {u.email.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex min-w-0 items-center gap-2 font-medium text-brand-950">
                            <span className="truncate">{u.email}</span>
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-white uppercase">
                                You
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 flex gap-3 text-[13px] text-muted-foreground md:hidden">
                            <Meta Icon={Icon}>{u.organization.name}</Meta>
                            <Meta Icon={MapPin}>{u.organization.city}</Meta>
                          </p>
                        </div>
                      </div>
                      <span className="hidden min-w-0 md:block">
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <Icon className="size-4 shrink-0 text-ink-400" />
                          <span className="truncate">{u.organization.name}</span>
                        </span>
                        <span className="ml-6 block text-xs text-muted-foreground">{ORG_LABEL[u.organization.type]}</span>
                      </span>
                      <span className="hidden text-sm text-ink-600 md:block">
                        <Meta Icon={MapPin}>{u.organization.city}</Meta>
                      </span>
                      <div className="flex items-center justify-between gap-3 pl-[3.6rem] md:contents">
                        <span>{u.organization.type !== 'REGULATOR' ? <OrgStatusBadge status={u.organization.status} /> : <span className="text-xs text-muted-foreground">Issuer</span>}</span>
                        <span className="text-xs whitespace-nowrap text-muted-foreground md:text-sm md:text-ink-600">{formatDate(u.createdAt)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </ListState>
      </Panel>
    </>
  )
}
