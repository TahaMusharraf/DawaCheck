import { CircleAlert, RotateCw, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 animate-rise sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
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
      className={cn('rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10 animate-rise', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            {title && <h2 className="font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
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
  tone?: 'sky' | 'green' | 'amber' | 'red' | 'slate'
  delay?: number
}) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/15',
    slate: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  }
  return (
    <div
      className="rounded-2xl bg-card p-5 shadow-xs ring-1 ring-foreground/10 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-xl ring-1', tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
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
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-foreground/5">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
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
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <CircleAlert className="size-6 text-red-500" />
      <p className="mt-3 text-sm font-medium">Couldn&apos;t load this</p>
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
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
