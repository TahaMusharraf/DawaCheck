'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Boxes, PackagePlus } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { BatchListHead, BatchRow } from '@/components/dashboard/rows'
import { EmptyState, ListState, PageHeader, Panel, SearchField, Segmented, Toolbar } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
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
        <Toolbar>
          <Segmented options={FILTERS} value={filter} onChange={setFilter} count={(f) => batches.data?.data.filter((b) => matches(b, f, '')).length} />
          <SearchField value={q} onChange={setQ} placeholder="Search drug, batch or maker" />
        </Toolbar>

        <ListState
          {...batches}
          data={rows}
          empty={<EmptyState Icon={Boxes} title="No batches found" description={q || filter !== 'All' ? 'Try a different search or filter.' : undefined} />}
        >
          {(list) => (
            <>
              <BatchListHead showManufacturer={regulator} />
              <ul className="stagger divide-y divide-ink-900/[0.05]">
                {list.map((b) => (
                  <BatchRow key={b.batchId} batch={b} showManufacturer={regulator} />
                ))}
              </ul>
            </>
          )}
        </ListState>
      </Panel>
    </>
  )
}
