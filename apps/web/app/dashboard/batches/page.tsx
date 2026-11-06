'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Boxes, PackagePlus, Search } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { BatchRow } from '@/components/dashboard/rows'
import { EmptyState, ListState, PageHeader, Panel } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { isExpired } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Batch } from '@/lib/types'

const FILTERS = ['All', 'Active', 'Recalled', 'Expired'] as const
type Filter = (typeof FILTERS)[number]

function matches(b: Batch, filter: Filter, q: string) {
  const text = `${b.drugName} ${b.batchNumber} ${b.manufacturer.name}`.toLowerCase()
  if (q && !text.includes(q.toLowerCase())) return false
  if (filter === 'Recalled') return b.recalled
  if (filter === 'Expired') return !b.recalled && isExpired(b.expiryDate)
  if (filter === 'Active') return !b.recalled && !isExpired(b.expiryDate)
  return true
}

export default function BatchesPage() {
  return (
    <RoleGate roles={['REGULATOR', 'MANUFACTURER']}>
      <Batches />
    </RoleGate>
  )
}

function Batches() {
  const { me } = useAuth()
  const regulator = me?.org.type === 'REGULATOR'
  const batches = useApi<{ data: Batch[] }>('/batches/all')
  const [filter, setFilter] = useState<Filter>('All')
  const [q, setQ] = useState('')
  const rows = batches.data?.data.filter((b) => matches(b, filter, q))

  return (
    <>
      <PageHeader
        title="Batches"
        description={regulator ? 'Every batch registered by every licensed manufacturer.' : 'Batches your organisation has registered on-chain.'}
        actions={
          !regulator && (
            <Button asChild>
              <Link href="/dashboard/batches/new">
                <PackagePlus />
                New batch
              </Link>
            </Button>
          )
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                  filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drug or batch no." className="pl-9" />
          </div>
        </div>

        <ListState
          {...batches}
          data={rows}
          empty={<EmptyState Icon={Boxes} title="No batches found" description={q || filter !== 'All' ? 'Try a different search or filter.' : undefined} />}
        >
          {(list) => (
            <ul className="divide-y">
              {list.map((b) => (
                <BatchRow key={b.batchId} batch={b} showManufacturer={regulator} />
              ))}
            </ul>
          )}
        </ListState>
      </Panel>
    </>
  )
}
