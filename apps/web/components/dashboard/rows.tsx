import Link from 'next/link'
import { CalendarClock, ChevronRight, Factory, Hash, Package, Pill } from 'lucide-react'
import { BatchStatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import type { Batch, Holding } from '@/lib/types'
import { IconTile, ListHead, Meta } from './ui'

// Rows are a grid of columns on desktop (with a ListHead above them) and a stacked
// title + facts layout on phones. Each list passes the same template to both.

const batchCols = (withMaker: boolean) =>
  withMaker
    ? 'minmax(0,2fr) 7.5rem 5.5rem 7rem minmax(0,1.3fr) 5.5rem 1rem'
    : 'minmax(0,2.6fr) 7.5rem 5.5rem 7rem 5.5rem 1rem'

export function BatchListHead({ showManufacturer }: { showManufacturer?: boolean }) {
  return (
    <ListHead cols={batchCols(!!showManufacturer)}>
      <span>Medicine</span>
      <span>Batch no.</span>
      <span className="text-right">Packs</span>
      <span>Expires</span>
      {showManufacturer && <span>Manufacturer</span>}
      <span>Status</span>
      <span />
    </ListHead>
  )
}

export function BatchRow({ batch, showManufacturer }: { batch: Batch; showManufacturer?: boolean }) {
  return (
    <li>
      <Link
        href={`/dashboard/batches/${batch.batchId}`}
        style={{ '--cols': batchCols(!!showManufacturer) } as React.CSSProperties}
        className="group relative flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-brand-50/60 md:grid md:grid-cols-[var(--cols)]"
      >
        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 origin-center scale-y-0 rounded-r-full bg-brand-500 transition-transform duration-300 group-hover:scale-y-100" />
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <IconTile Icon={Pill} />
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-950">
              {batch.drugName} <span className="font-normal text-muted-foreground">{batch.dosage}</span>
            </p>
            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground md:hidden">
              <Meta Icon={Hash}>{batch.batchNumber}</Meta>
              <Meta Icon={Package}>{batch.quantity.toLocaleString()} packs</Meta>
              <Meta Icon={CalendarClock}>{formatDate(batch.expiryDate)}</Meta>
            </p>
          </div>
        </div>
        <span className="hidden truncate font-mono text-[13px] text-ink-600 md:block">{batch.batchNumber}</span>
        <span className="hidden text-right text-sm tabular-nums md:block">{batch.quantity.toLocaleString()}</span>
        <span className="hidden text-sm text-ink-600 md:block">{formatDate(batch.expiryDate)}</span>
        {showManufacturer && (
          <span className="hidden min-w-0 md:block">
            <Meta Icon={Factory} className="text-sm text-ink-600">
              {batch.manufacturer.name}
            </Meta>
          </span>
        )}
        <span>
          <BatchStatusBadge recalled={batch.recalled} expiryDate={batch.expiryDate} />
        </span>
        <ChevronRight className="hidden size-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600 sm:block" />
      </Link>
    </li>
  )
}

const HOLDING_COLS = 'minmax(0,2.4fr) 7.5rem 7rem minmax(9rem,1fr) auto'

export function HoldingListHead({ withAction }: { withAction?: boolean }) {
  return (
    <ListHead cols={HOLDING_COLS}>
      <span>Medicine</span>
      <span>Batch no.</span>
      <span>Expires</span>
      <span className="text-right">In stock</span>
      <span className={withAction ? 'w-24' : ''} />
    </ListHead>
  )
}

export function HoldingRow({ holding, action }: { holding: Holding; action?: React.ReactNode }) {
  return (
    <li
      style={{ '--cols': HOLDING_COLS } as React.CSSProperties}
      className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-brand-50/60 md:grid md:grid-cols-[var(--cols)]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <IconTile Icon={Pill} />
        <div className="min-w-0">
          <p className="truncate font-medium text-brand-950">{holding.drugName}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-muted-foreground md:hidden">
            <Meta Icon={Hash}>{holding.batchNumber}</Meta>
            <Meta Icon={CalendarClock}>{formatDate(holding.expiryDate)}</Meta>
          </p>
        </div>
      </div>
      <span className="hidden truncate font-mono text-[13px] text-ink-600 md:block">{holding.batchNumber}</span>
      <span className="hidden text-sm text-ink-600 md:block">{formatDate(holding.expiryDate)}</span>
      <div className="text-right">
        <p className="font-display text-2xl leading-none text-brand-900 tabular-nums">{holding.held.toLocaleString()}</p>
        <p className="mt-0.5 text-[11px] tracking-wide text-muted-foreground uppercase">packs</p>
      </div>
      <div className={action ? 'w-24 text-right' : ''}>{action}</div>
    </li>
  )
}
