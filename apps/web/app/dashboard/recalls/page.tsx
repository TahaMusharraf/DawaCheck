'use client'

import { ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react'
import { EmptyState, ListState, PageHeader, Panel } from '@/components/dashboard/ui'
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
            <ul className="divide-y">
              {rows.map((r) => {
                const holding = (r.held ?? 0) > 0
                return (
                  <li key={r.id} className={cn('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4', holding && 'bg-red-50/60')}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-600/20">
                      <ShieldAlert className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {r.batch.drugName} <span className="font-normal text-muted-foreground">{r.batch.dosage}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.batch.batchNumber} · recalled {formatDate(r.issuedAt)} by {r.issuedBy.name} ({humanize(r.issuedBy.type)})
                      </p>
                      <p className="mt-1 text-sm">&ldquo;{r.reason}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      {!regulator && (holding ? <Pill tone="red">You hold {r.held!.toLocaleString()}</Pill> : <Pill tone="slate">None held</Pill>)}
                      <a href={txUrl(r.txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline">
                        On-chain record
                        <ExternalLink className="size-3" />
                      </a>
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
