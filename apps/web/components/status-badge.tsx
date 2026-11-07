import { cn } from '@/lib/utils'
import type { AlertStatus, OrgStatus } from '@/lib/types'

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'sky'

const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
}

const DOT: Record<Tone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
  sky: 'bg-sky-500',
}

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT[tone])} />
      {children}
    </span>
  )
}

const ORG_TONE: Record<OrgStatus, Tone> = { PENDING: 'amber', LICENSED: 'green', REVOKED: 'red' }

export function OrgStatusBadge({ status }: { status: OrgStatus }) {
  return <Pill tone={ORG_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>
}

const ALERT_TONE: Record<AlertStatus, Tone> = { OPEN: 'red', INVESTIGATING: 'amber', CONFIRMED: 'red', DISMISSED: 'slate' }

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <Pill tone={ALERT_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>
}

export function BatchStatusBadge({ recalled, expiryDate }: { recalled: boolean; expiryDate: string }) {
  if (recalled) return <Pill tone="red">Recalled</Pill>
  if (new Date(expiryDate) < new Date()) return <Pill tone="amber">Expired</Pill>
  return <Pill tone="green">Active</Pill>
}
