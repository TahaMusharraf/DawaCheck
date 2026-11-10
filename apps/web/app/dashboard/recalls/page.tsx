'use client'

import { Building2, CalendarX2, ExternalLink, Hash, Quote, ShieldAlert, ShieldCheck } from 'lucide-react'
import { EmptyState, IconTile, ListState, Meta, PageHeader, Panel } from '@/components/dashboard/ui'
import { Pill } from '@/components/status-badge'
import { useAuth } from '@/lib/auth'
import { formatDate, humanize, txUrl } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import type { Recall } from '@/lib/types'

export default function RecallsPage() {
  const { me } = useAuth()
  const recalls = useApi<{ recalls: Recall[] }>('/recalls')
  const regulator = me?.org.type === 'REGULATOR'

  const description = regulator
    ? 'Every batch withdrawn from the market.'
    : me?.org.type === 'MANUFACTURER'
      ? 'Recalls of batches you manufactured.'
      : 'Recalls of batches that passed through your hands. Anything you still hold must come off the shelf.'

  return (
    <>
      <PageHeader title="Recalls" description={description} />
      <Panel>
        <ListState
          {...recalls}
          data={recalls.data?.recalls}
          empty={<EmptyState Icon={ShieldCheck} title="No recalls" description="Nothing you are involved with has been recalled." />}
        >
          {(rows) => (
            <ul className="stagger divide-y divide-ink-900/[0.05]">
              {rows.map((r) => {
                const holding = (r.held ?? 0) > 0
                return (
                  <li
                    key={r.id}
                    className={cn(
                      'group relative flex flex-col gap-4 px-5 py-5 transition-colors sm:flex-row sm:gap-5',
                      holding ? 'bg-red-50/50' : 'hover:bg-brand-50/40',
                    )}
                  >
                    {holding && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-red-500" />}
                    <IconTile Icon={ShieldAlert} tone="red" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-brand-950">
                          {r.batch.drugName} <span className="font-normal text-muted-foreground">{r.batch.dosage}</span>
                        </p>
                        {!regulator && (holding ? <Pill tone="red" pulse>You hold {r.held!.toLocaleString()}</Pill> : <Pill tone="slate">None held</Pill>)}
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                        <Meta Icon={Hash}>{r.batch.batchNumber}</Meta>
                        <Meta Icon={CalendarX2}>Recalled {formatDate(r.issuedAt)}</Meta>
                        <Meta Icon={Building2}>
                          {r.issuedBy.name} · {humanize(r.issuedBy.type)}
                        </Meta>
                      </p>
                      <blockquote className="mt-3 flex gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700 ring-1 ring-ink-900/[0.04]">
                        <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
                        {r.reason}
                      </blockquote>
                    </div>
                    <a
                      href={txUrl(r.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-fit items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-brand-700 ring-1 ring-brand-600/15 transition-colors hover:bg-brand-50"
                    >
                      On-chain record
                      <ExternalLink className="size-3" />
                    </a>
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
