'use client'

import Link from 'next/link'
import { Truck, Warehouse } from 'lucide-react'
import { RoleGate } from '@/components/dashboard/role-gate'
import { HoldingListHead, HoldingRow } from '@/components/dashboard/rows'
import { EmptyState, ListState, PageHeader, Panel } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useApi } from '@/lib/use-api'
import type { Holding } from '@/lib/types'

export default function InventoryPage() {
  return (
    <RoleGate roles={['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY']}>
      <Inventory />
    </RoleGate>
  )
}

function Inventory() {
  const { me } = useAuth()
  const canDispatch = me?.org.type !== 'PHARMACY'
  const holdings = useApi<{ data: Holding[] }>('/custody/custody/holdings')

  return (
    <>
      <PageHeader title="Inventory" description="Packs your organisation holds right now, read live from the blockchain." />
      <Panel>
        <ListState
          {...holdings}
          data={holdings.data?.data}
          empty={<EmptyState Icon={Warehouse} title="Nothing in stock" description="Stock appears here once it is registered by you or dispatched to you on-chain." />}
        >
          {(rows) => (
            <>
              <HoldingListHead withAction={canDispatch} />
              <ul className="stagger divide-y divide-ink-900/[0.05]">
              {rows.map((h) => (
                <HoldingRow
                  key={h.batchId}
                  holding={h}
                  action={
                    canDispatch && (
                      <Button variant="outline" size="sm" className="hidden opacity-70 transition-opacity group-hover:opacity-100 sm:inline-flex" asChild>
                        <Link href={`/dashboard/dispatch?batch=${h.batchId}`}>
                          <Truck />
                          Dispatch
                        </Link>
                      </Button>
                    )
                  }
                />
              ))}
              </ul>
            </>
          )}
        </ListState>
      </Panel>
    </>
  )
}
