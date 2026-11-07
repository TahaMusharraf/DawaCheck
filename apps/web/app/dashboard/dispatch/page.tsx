'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ArrowDown, ExternalLink, LoaderCircle, Truck, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { EmptyState, FormField, PageHeader, Panel } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { send } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { txUrl } from '@/lib/format'
import { useApi } from '@/lib/use-api'
import type { Holding, Partner } from '@/lib/types'

export default function DispatchPage() {
  return (
    <RoleGate roles={['MANUFACTURER', 'DISTRIBUTOR']}>
      {/* useSearchParams needs a Suspense boundary so the page can still be prerendered. */}
      <Suspense>
        <Dispatch />
      </Suspense>
    </RoleGate>
  )
}

function Dispatch() {
  const { me } = useAuth()
  const params = useSearchParams()
  const holdings = useApi<{ data: Holding[] }>('/custody/custody/holdings')
  const partners = useApi<{ data: Partner[] }>('/organization/partners')

  const [batchId, setBatchId] = useState(params.get('batch') ?? '')
  const [toOrgId, setToOrgId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [busy, setBusy] = useState(false)

  const target = me?.org.type === 'MANUFACTURER' ? 'distributor' : 'pharmacy'
  const selected = holdings.data?.data.find((h) => h.batchId === batchId)
  const qty = Number(quantity)
  const valid = selected && toOrgId && qty >= 1 && qty <= selected.held

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    try {
      const res = await send<{ data: { txHash: string; remaining: number } }>('POST', '/custody/transfer', { batchId, toOrgId, quantity: qty })
      toast.success(`${qty.toLocaleString()} packs dispatched`, {
        description: `${res.data.remaining.toLocaleString()} left in stock.`,
        action: { label: 'View tx', onClick: () => window.open(txUrl(res.data.txHash), '_blank') },
      })
      setQuantity('')
      holdings.reload()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const loading = !holdings.data || !partners.data

  return (
    <>
      <PageHeader title="Dispatch stock" description={`Hand packs over to a licensed ${target}. The transfer is recorded on-chain.`} />

      <div className="mx-auto max-w-2xl">
        <Panel>
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : holdings.data!.data.length === 0 ? (
            <EmptyState
              Icon={Warehouse}
              title="Nothing to dispatch"
              description="You don't hold any stock right now."
              action={
                <Button variant="outline" asChild>
                  <Link href="/dashboard/inventory">Go to inventory</Link>
                </Button>
              }
            />
          ) : (
            <form onSubmit={onSubmit} className="p-5 sm:p-6">
              <FormField label="Batch" htmlFor="batch">
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger id="batch" className="h-11 w-full">
                    <SelectValue placeholder="Choose a batch you hold" />
                  </SelectTrigger>
                  <SelectContent>
                    {holdings.data!.data.map((h) => (
                      <SelectItem key={h.batchId} value={h.batchId}>
                        {h.drugName} · {h.batchNumber} ({h.held.toLocaleString()} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="my-3 flex justify-center">
                <span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground">
                  <ArrowDown className="size-4" />
                </span>
              </div>

              <FormField label={`To ${target}`} htmlFor="partner" hint={partners.data!.data.length === 0 ? `No licensed ${target} yet.` : undefined}>
                <Select value={toOrgId} onValueChange={setToOrgId}>
                  <SelectTrigger id="partner" className="h-11 w-full">
                    <SelectValue placeholder={`Choose a ${target}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.data!.data.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {p.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Packs"
                htmlFor="quantity"
                className="mt-5"
                hint={selected ? `You hold ${selected.held.toLocaleString()} of this batch.` : undefined}
              >
                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selected?.held}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="h-11"
                  />
                  {selected && (
                    <Button type="button" variant="outline" className="h-11" onClick={() => setQuantity(String(selected.held))}>
                      All
                    </Button>
                  )}
                </div>
              </FormField>

              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5">
                <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <ExternalLink className="size-3" />
                  Signed by your organisation&apos;s custodial wallet
                </p>
                <Button type="submit" className="h-10 px-5" disabled={!valid || busy}>
                  {busy ? <LoaderCircle className="animate-spin" /> : <Truck />}
                  {busy ? 'Recording on-chain…' : 'Dispatch'}
                </Button>
              </div>
            </form>
          )}
        </Panel>
      </div>
    </>
  )
}
