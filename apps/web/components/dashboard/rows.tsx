import Link from 'next/link'
import { ChevronRight, Pill } from 'lucide-react'
import { BatchStatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import type { Batch, Holding } from '@/lib/types'

export function BatchRow({ batch, showManufacturer }: { batch: Batch; showManufacturer?: boolean }) {
  return (
    <li>
      <Link
        href={`/dashboard/batches/${batch.batchId}`}
        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15">
          <Pill className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {batch.drugName} <span className="font-normal text-muted-foreground">{batch.dosage}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {batch.batchNumber} · {batch.quantity.toLocaleString()} packs · exp {formatDate(batch.expiryDate)}
            {showManufacturer && <span className="hidden sm:inline"> · {batch.manufacturer.name}</span>}
          </p>
        </div>
        <BatchStatusBadge recalled={batch.recalled} expiryDate={batch.expiryDate} />
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}

export function HoldingRow({ holding, action }: { holding: Holding; action?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15">
        <Pill className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{holding.drugName}</p>
        <p className="truncate text-sm text-muted-foreground">
          {holding.batchNumber} · exp {formatDate(holding.expiryDate)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold tabular-nums">{holding.held.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">packs</p>
      </div>
      {action}
    </li>
  )
}
