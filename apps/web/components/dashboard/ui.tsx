'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import { CircleAlert, RotateCw, Search, type LucideIcon } from 'lucide-react'
import { CountUp } from '@/components/landing/count-up'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { currentItem } from './nav'

// ---- Page furniture ----

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  /** Defaults to the page's sidebar group, e.g. "Supply chain". */
  eyebrow?: string
}) {
  const pathname = usePathname()
  const label = eyebrow ?? currentItem(pathname)?.group

  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-9">
      <div className="min-w-0">
        {label && (
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-brand-600 uppercase">
            <span className="h-px w-5 bg-brand-400" />
            {label}
          </p>
        )}
        <h1 className="text-[1.7rem] leading-tight font-semibold tracking-tight text-brand-950 lg:text-[2rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  delay = 0,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <section
      className={cn('overflow-hidden rounded-2xl bg-card/95 shadow-panel ring-1 ring-ink-900/[0.06] backdrop-blur-sm animate-rise', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-ink-900/[0.06] px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-brand-950">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// ---- Numbers ----

const TONES = {
  sky: { icon: 'text-brand-600', bar: 'bg-brand-600' },
  green: { icon: 'text-brand-500', bar: 'bg-brand-400' },
  amber: { icon: 'text-amber-600', bar: 'bg-amber-500' },
  red: { icon: 'text-red-600', bar: 'bg-red-500' },
  slate: { icon: 'text-ink-500', bar: 'bg-ink-400' },
}

/** A row of figures sharing one surface, split by hairlines. Holds StatCards. */
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // On phones a lone last figure spans both columns instead of leaving a hole.
        'grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink-900/[0.06] shadow-panel ring-1 ring-ink-900/[0.06] lg:grid-cols-4 [&>:last-child:nth-child(odd)]:col-span-2 lg:[&>:last-child:nth-child(odd)]:col-span-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Counts plain numbers up ("1,204", "92%"); anything else is shown as given. */
function Figure({ value }: { value: React.ReactNode }) {
  if (typeof value === 'string') {
    const m = /^([\d,]+)(%?)$/.exec(value)
    if (m) return <CountUp to={Number(m[1].replace(/,/g, ''))} suffix={m[2]} duration={900} />
  }
  if (typeof value === 'number') return <CountUp to={value} duration={900} />
  return <>{value}</>
}

export function StatCard({
  label,
  value,
  hint,
  Icon,
  tone = 'sky',
  delay = 0,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  Icon: LucideIcon
  tone?: keyof typeof TONES
  delay?: number
}) {
  const t = TONES[tone]
  return (
    <div className="group relative bg-card/95 p-5 backdrop-blur-sm animate-rise lg:p-6" style={{ animationDelay: `${delay}ms` }}>
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <Icon className={cn('size-4', t.icon)} />
        {label}
      </p>
      <p className="mt-3 font-display text-[2.6rem] leading-none tracking-tight text-brand-950 tabular-nums lg:text-5xl">
        <Figure value={value} />
      </p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100',
          t.bar,
        )}
      />
    </div>
  )
}

// ---- Controls ----

/** Pill tabs with an indicator that slides to the selected option. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label = (o) => String(o),
  count,
  size = 'md',
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  label?: (o: T) => React.ReactNode
  count?: (o: T) => number | undefined
  size?: 'sm' | 'md'
  className?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>('[data-active=true]')
    if (el) setPos({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options])

  return (
    <div
      ref={wrap}
      role="tablist"
      className={cn('relative flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-xl bg-ink-100/80 p-1 ring-1 ring-ink-900/[0.04] ring-inset', className)}
    >
      {pos && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-lg bg-card shadow-[0_1px_2px_rgb(17_24_19/0.08),0_2px_8px_-2px_rgb(17_24_19/0.08)] ring-1 ring-ink-900/[0.05] transition-all duration-300 ease-out-expo"
          style={{ left: pos.left, width: pos.width }}
        />
      )}
      {options.map((o) => {
        const on = o === value
        const n = count?.(o)
        return (
          <button
            key={String(o)}
            role="tab"
            aria-selected={on}
            data-active={on}
            onClick={() => onChange(o)}
            className={cn(
              'relative z-10 flex items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              on ? 'text-brand-900' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label(o)}
            {n !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums transition-colors',
                  on ? 'bg-brand-100 text-brand-700' : 'bg-ink-900/[0.06]',
                )}
              >
                {n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn('group relative sm:w-72', className)}>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand-600" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 pl-9" />
    </div>
  )
}

/** The bar above a list: filters on the left, search on the right. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-900/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">{children}</div>
  )
}

// ---- Lists ----

/** Column labels for a list laid out on a grid. Hidden on phones, where rows stack. */
export function ListHead({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div
      className="hidden items-center gap-4 border-b border-ink-900/[0.06] bg-ink-50/70 px-5 py-2.5 text-[11px] font-medium tracking-[0.08em] text-ink-500 uppercase md:grid"
      style={{ gridTemplateColumns: cols }}
    >
      {children}
    </div>
  )
}

/** The rounded square that leads a row. */
export function IconTile({ Icon, tone = 'brand', size = 'md' }: { Icon: LucideIcon; tone?: 'brand' | 'red' | 'amber' | 'ink'; size?: 'md' | 'lg' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
    red: 'bg-red-50 text-red-700 ring-red-600/15',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    ink: 'bg-ink-100 text-ink-700 ring-ink-600/10',
  }
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center ring-1 transition-transform duration-300 ease-out group-hover:scale-105',
        size === 'lg' ? 'size-14 rounded-2xl' : 'size-10 rounded-xl',
        tones[tone],
      )}
    >
      <Icon className={size === 'lg' ? 'size-6' : 'size-[18px]'} />
    </span>
  )
}

/** A short labelled fact under a row title, e.g. a pin and a city. */
export function Meta({ Icon, children, className }: { Icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      {Icon && <Icon className="size-3.5 shrink-0 text-ink-400" />}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** 0–100 risk as a short bar, coloured by how bad it is. */
export function RiskMeter({ value }: { value: number }) {
  const tone = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-amber-500' : 'bg-brand-400'
  return (
    <span className="flex items-center gap-2" title={`Risk ${value} of 100`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
        <span className={cn('block h-full origin-left rounded-full animate-grow-x', tone)} style={{ width: `${Math.min(value, 100)}%` }} />
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </span>
  )
}

export function EmptyState({
  Icon,
  title,
  description,
  action,
}: {
  Icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="relative grid size-14 place-items-center">
        <span className="absolute inset-0 rounded-2xl bg-brand-100/70 animate-pulse-ring" />
        <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-b from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-600/10 animate-float">
          <Icon className="size-6" />
        </span>
      </span>
      <p className="mt-5 font-medium text-brand-950">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-ink-900/[0.05]">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ opacity: 1 - i * 0.15 }}>
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-600/15 animate-pop">
        <CircleAlert className="size-6" />
      </span>
      <p className="mt-4 text-sm font-medium">Couldn&apos;t load this</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw />
          Try again
        </Button>
      )}
    </div>
  )
}

/** Wraps a list: skeleton while loading, error with retry, empty state, else the rows. */
export function ListState<T>({
  data,
  loading,
  error,
  reload,
  empty,
  children,
}: {
  data: T[] | undefined
  loading: boolean
  error?: string
  reload: () => void
  empty: React.ReactNode
  children: (rows: T[]) => React.ReactNode
}) {
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) return loading ? <ListSkeleton /> : null
  if (data.length === 0) return <>{empty}</>
  return <>{children(data)}</>
}

export function FormField({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-brand-950">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
