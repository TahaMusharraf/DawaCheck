import { Blocks, Building2, CalendarDays, CalendarX2, Hash, Pill, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, shortHash } from '@/lib/format'
import type { VerifyResponse } from '@/lib/types'

type Data = VerifyResponse['data']

export function ProductCard({ batch, manufacturer }: { batch: NonNullable<Data['batch']>; manufacturer: Data['manufacturer'] }) {
  const expired = new Date(batch.expiryDate) < new Date()

  return (
    <section
      className="rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-foreground/10 backdrop-blur animate-rise"
      style={{ animationDelay: '120ms' }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15">
          <Pill className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">{batch.drugName}</h2>
          <p className="text-sm text-muted-foreground">{batch.dosage}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-5 sm:grid-cols-3">
        <Field icon={Building2} label="Manufacturer" value={manufacturer?.name ?? '—'} className="col-span-2" />
        <Field icon={Hash} label="Batch no." value={batch.batchNumber} />
        <Field icon={Blocks} label="On-chain ID" value={shortHash(batch.batchId)} mono />
        <Field icon={CalendarDays} label="Manufactured" value={formatDate(batch.mfgDate)} />
        <Field
          icon={CalendarX2}
          label="Expires"
          value={formatDate(batch.expiryDate)}
          valueClassName={expired ? 'text-red-600' : undefined}
        />
      </dl>
    </section>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
  className,
  valueClassName,
}: {
  icon: LucideIcon
  label: string
  value: string
  mono?: boolean
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className={cn('mt-1 truncate text-sm font-medium', mono && 'font-mono text-[13px]', valueClassName)}>{value}</dd>
    </div>
  )
}
