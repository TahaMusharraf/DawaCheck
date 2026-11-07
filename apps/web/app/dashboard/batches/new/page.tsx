'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Blocks, CircleCheck, Download, LoaderCircle, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { RoleGate } from '@/components/dashboard/role-gate'
import { FormField, PageHeader, Panel } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { download, send } from '@/lib/api'
import { todayInput, txUrl } from '@/lib/format'
import type { Batch } from '@/lib/types'

type Created = { batch: Omit<Batch, 'manufacturer'>; codes: string[] }

export default function NewBatchPage() {
  return (
    <RoleGate roles={['MANUFACTURER']}>
      <NewBatch />
    </RoleGate>
  )
}

function NewBatch() {
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<Created | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      const res = await send<{ data: Created }>('POST', '/batches/create', {
        drugName: f.get('drugName'),
        dosage: f.get('dosage'),
        batchNumber: f.get('batchNumber'),
        quantity: Number(f.get('quantity')),
        manufacturingDate: f.get('manufacturingDate'),
        expiryDate: f.get('expiryDate'),
      })
      setCreated(res.data)
      toast.success('Batch registered on-chain')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (created) return <Success created={created} onAnother={() => setCreated(null)} />

  return (
    <>
      <PageHeader title="Register a batch" description="We generate a secret code per pack and write one Merkle root for the whole batch to the blockchain." />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <form onSubmit={onSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField label="Drug name" htmlFor="drugName" className="sm:col-span-2">
              <Input id="drugName" name="drugName" required placeholder="Panadol" />
            </FormField>
            <FormField label="Dosage" htmlFor="dosage">
              <Input id="dosage" name="dosage" required placeholder="500 mg" />
            </FormField>
            <FormField label="Batch number" htmlFor="batchNumber" hint="Must be unique. It becomes the on-chain batch id.">
              <Input id="batchNumber" name="batchNumber" required placeholder="PN-2611-A" />
            </FormField>
            <FormField label="Number of packs" htmlFor="quantity" hint="1 to 5,000 per batch.">
              <Input id="quantity" name="quantity" type="number" min={1} max={5000} required defaultValue={100} />
            </FormField>
            <div className="hidden sm:block" />
            <FormField label="Manufactured on" htmlFor="manufacturingDate">
              <Input id="manufacturingDate" name="manufacturingDate" type="date" required defaultValue={todayInput()} />
            </FormField>
            <FormField label="Expires on" htmlFor="expiryDate">
              <Input id="expiryDate" name="expiryDate" type="date" required defaultValue={todayInput(2)} />
            </FormField>
            <div className="flex justify-end border-t pt-5 sm:col-span-2">
              <Button type="submit" className="h-10 px-5" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" /> : <PackagePlus />}
                {busy ? 'Writing to the blockchain…' : 'Register batch'}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="h-fit bg-slate-950 text-slate-100 ring-slate-800" delay={120}>
          <div className="p-5">
            <Blocks className="size-5 text-sky-300" />
            <p className="mt-3 font-semibold">What happens on submit</p>
            <ol className="mt-3 space-y-2.5 text-sm text-slate-300">
              {['A secret code is generated for every pack', 'Each code is hashed and built into a Merkle tree', 'Only the 32-byte root is sent on-chain, in one transaction', 'You download a PDF of QR labels to print'].map(
                (t, i) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="font-mono text-sky-300">{i + 1}.</span>
                    {t}
                  </li>
                ),
              )}
            </ol>
          </div>
        </Panel>
      </div>
    </>
  )
}

function Success({ created, onAnother }: { created: Created; onAnother: () => void }) {
  const { batch } = created
  const [busy, setBusy] = useState(false)

  async function labels() {
    setBusy(true)
    try {
      await download(`/batches/${batch.batchId}/labels`, `labels-${batch.batchNumber}.pdf`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Panel className="p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 animate-pop">
          <CircleCheck className="size-8" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Batch registered</h1>
        <p className="mt-1 text-muted-foreground">
          {batch.drugName} {batch.dosage} · {batch.batchNumber} · {batch.quantity.toLocaleString()} packs
        </p>
        {batch.txHash && (
          <a href={txUrl(batch.txHash)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sky-700 underline-offset-4 hover:underline">
            View the transaction on Polygonscan
          </a>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={labels} disabled={busy} className="h-10">
            {busy ? <LoaderCircle className="animate-spin" /> : <Download />}
            Download QR labels
          </Button>
          <Button variant="outline" className="h-10" asChild>
            <Link href={`/dashboard/batches/${batch.batchId}`}>
              Open batch
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <button onClick={onAnother} className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline">
          Register another batch
        </button>
      </Panel>
    </div>
  )
}
