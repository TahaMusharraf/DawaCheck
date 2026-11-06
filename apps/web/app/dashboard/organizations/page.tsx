'use client'

import { useState } from 'react'
import { BadgeCheck, Ban, Building2, ExternalLink, Factory, LoaderCircle, Search, Store, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, ListState, PageHeader, Panel } from '@/components/dashboard/ui'
import { OrgStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { send } from '@/lib/api'
import { formatDate, humanize, shortHash, txUrl } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { Organization, OrgStatus } from '@/lib/types'

const TABS: (OrgStatus | 'ALL')[] = ['PENDING', 'LICENSED', 'REVOKED', 'ALL']
const TYPE_ICON = { MANUFACTURER: Factory, DISTRIBUTOR: Truck, PHARMACY: Store, REGULATOR: Building2 }

export default function OrganizationsPage() {
  return (
    <RoleGate roles={['REGULATOR']}>
      <Organizations />
    </RoleGate>
  )
}

function Organizations() {
  const orgs = useApi<{ data: Organization[] }>('/organization/getOrganization')
  const [tab, setTab] = useState<(typeof TABS)[number]>('PENDING')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<Organization | null>(null)

  const all = orgs.data?.data.filter((o) => o.type !== 'REGULATOR')
  const count = (s: OrgStatus) => all?.filter((o) => o.status === s).length ?? 0
  const rows = all?.filter(
    (o) => (tab === 'ALL' || o.status === tab) && `${o.name} ${o.city} ${o.licenseNo}`.toLowerCase().includes(q.toLowerCase()),
  )

  async function act(org: Organization, action: 'approve' | 'revoke') {
    setBusyId(org.id)
    try {
      await send('PUT', `/organization/${action}Organization/${org.id}`)
      toast.success(action === 'approve' ? `${org.name} is licensed` : `${org.name}'s licence was revoked`, {
        description: 'Recorded on the blockchain.',
      })
      setRevoking(null)
      orgs.reload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Organisations" description="Approve applications and revoke licences. Both are written to the blockchain." />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'ALL' ? 'All' : humanize(t)}
                {t !== 'ALL' && all && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-xs tabular-nums',
                      t === 'PENDING' && count(t) > 0 ? 'bg-amber-500 text-white' : 'bg-foreground/10',
                    )}
                  >
                    {count(t)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, licence" className="pl-9" />
          </div>
        </div>

        <ListState
          {...orgs}
          data={rows}
          empty={<EmptyState Icon={Building2} title={tab === 'PENDING' ? 'No applications waiting' : 'No organisations here'} />}
        >
          {(list) => (
            <ul className="divide-y">
              {list.map((o) => {
                const Icon = TYPE_ICON[o.type]
                return (
                  <li key={o.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/70 ring-1 ring-foreground/5">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{o.name}</p>
                          <OrgStatusBadge status={o.status} />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {humanize(o.type)} · {o.city} · Licence {o.licenseNo} · applied {formatDate(o.createdAt)}
                        </p>
                        {o.walletAddress && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            Wallet <span className="font-mono">{shortHash(o.walletAddress)}</span>
                            {o.licenseTxHash && (
                              <a href={txUrl(o.licenseTxHash)} target="_blank" rel="noreferrer" className="text-sky-700" aria-label="Licence transaction">
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 md:justify-end">
                      {o.status === 'PENDING' && (
                        <Button size="sm" onClick={() => act(o, 'approve')} disabled={busyId === o.id}>
                          {busyId === o.id ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
                          {busyId === o.id ? 'Licensing on-chain…' : 'Approve'}
                        </Button>
                      )}
                      {o.status === 'LICENSED' && (
                        <Button size="sm" variant="outline" className="text-red-700 hover:text-red-700" onClick={() => setRevoking(o)}>
                          <Ban />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ListState>
      </Panel>

      <Dialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke {revoking?.name}?</DialogTitle>
            <DialogDescription>
              Their on-chain licence is removed straight away. They can no longer register, receive or dispatch stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busyId !== null} onClick={() => revoking && act(revoking, 'revoke')}>
              {busyId && <LoaderCircle className="animate-spin" />}
              Revoke licence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
