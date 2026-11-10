'use client'

import { useState } from 'react'
import { BadgeCheck, Ban, Building2, ExternalLink, Factory, FileBadge, LoaderCircle, MapPin, Store, Truck, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, IconTile, ListHead, ListState, Meta, PageHeader, Panel, SearchField, Segmented, Toolbar } from '@/components/dashboard/ui'
import { OrgStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { send } from '@/lib/api'
import { formatDate, humanize, shortHash, txUrl } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Organization, OrgStatus } from '@/lib/types'

const TABS: (OrgStatus | 'ALL')[] = ['PENDING', 'LICENSED', 'REVOKED', 'ALL']
const TYPE_ICON = { MANUFACTURER: Factory, DISTRIBUTOR: Truck, PHARMACY: Store, REGULATOR: Building2 }
const COLS = 'minmax(0,2fr) 7rem 8rem 7rem 6.5rem 9.5rem'

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
        <Toolbar>
          <Segmented
            options={TABS}
            value={tab}
            onChange={setTab}
            label={(t) => (t === 'ALL' ? 'All' : humanize(t))}
            count={(t) => (t === 'ALL' || !all ? undefined : count(t))}
          />
          <SearchField value={q} onChange={setQ} placeholder="Search name, city, licence" />
        </Toolbar>

        <ListState
          {...orgs}
          data={rows}
          empty={<EmptyState Icon={Building2} title={tab === 'PENDING' ? 'No applications waiting' : 'No organisations here'} />}
        >
          {(list) => (
            <>
              <ListHead cols={COLS}>
                <span>Organisation</span>
                <span>City</span>
                <span>Licence no.</span>
                <span>Applied</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </ListHead>
              <ul className="stagger divide-y divide-ink-900/[0.05]">
                {list.map((o) => {
                  const Icon = TYPE_ICON[o.type]
                  return (
                    <li
                      key={o.id}
                      style={{ '--cols': COLS } as React.CSSProperties}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors duration-200 hover:bg-brand-50/50 md:grid md:grid-cols-[var(--cols)] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <IconTile Icon={Icon} tone={o.status === 'PENDING' ? 'amber' : o.status === 'REVOKED' ? 'ink' : 'brand'} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand-950">{o.name}</p>
                          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-muted-foreground">
                            <Meta>{humanize(o.type)}</Meta>
                            {o.walletAddress && (
                              <span className="inline-flex items-center gap-1.5">
                                <Wallet className="size-3.5 text-ink-400" />
                                <span className="font-mono text-xs">{shortHash(o.walletAddress)}</span>
                                {o.licenseTxHash && (
                                  <a href={txUrl(o.licenseTxHash)} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800" aria-label="Licence transaction">
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="flex flex-wrap gap-x-4 gap-y-1 pl-[3.6rem] text-[13px] text-muted-foreground md:hidden">
                        <Meta Icon={MapPin}>{o.city}</Meta>
                        <Meta Icon={FileBadge}>{o.licenseNo}</Meta>
                        <Meta>Applied {formatDate(o.createdAt)}</Meta>
                      </p>
                      <span className="hidden text-sm text-ink-600 md:block">
                        <Meta Icon={MapPin}>{o.city}</Meta>
                      </span>
                      <span className="hidden truncate font-mono text-[13px] text-ink-600 md:block">{o.licenseNo}</span>
                      <span className="hidden text-sm text-ink-600 md:block">{formatDate(o.createdAt)}</span>
                      <div className="flex items-center justify-between gap-2 pl-[3.6rem] md:contents">
                        <span>
                          <OrgStatusBadge status={o.status} />
                        </span>
                        <div className="flex md:justify-end">
                          {o.status === 'PENDING' && (
                            <Button size="sm" onClick={() => act(o, 'approve')} disabled={busyId === o.id}>
                              {busyId === o.id ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
                              {busyId === o.id ? 'Licensing…' : 'Approve'}
                            </Button>
                          )}
                          {o.status === 'LICENSED' && (
                            <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setRevoking(o)}>
                              <Ban />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
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
