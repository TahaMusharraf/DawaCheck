import { cn } from '@/lib/utils'
import type { AlertStatus, OrgStatus } from '@/lib/types'

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'sky'

const TONE: Record<Tone, string> = {
  green: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
  slate: 'bg-ink-100 text-ink-600 ring-ink-500/15',
  sky: 'bg-mint/60 text-brand-800 ring-brand-600/15',
}

const DOT: Record<Tone, string> = {
  green: 'bg-brand-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-ink-400',
  sky: 'bg-brand-500',
}

/** A status chip. `pulse` adds a live ring to the dot, for states that need attention. */
export function Pill({ tone, children, className, pulse }: { tone: Tone; children: React.ReactNode; className?: string; pulse?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {pulse && <span className={cn('absolute inset-0 rounded-full animate-pulse-ring', DOT[tone])} />}
        <span className={cn('relative size-1.5 rounded-full', DOT[tone])} />
      </span>
      {children}
    </span>
  )
}

const ORG_TONE: Record<OrgStatus, Tone> = { PENDING: 'amber', LICENSED: 'green', REVOKED: 'red' }

export function OrgStatusBadge({ status }: { status: OrgStatus }) {
  return <Pill tone={ORG_TONE[status]} pulse={status === 'PENDING'}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>
}

const ALERT_TONE: Record<AlertStatus, Tone> = { OPEN: 'red', INVESTIGATING: 'amber', CONFIRMED: 'red', DISMISSED: 'slate' }

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <Pill tone={ALERT_TONE[status]} pulse={status === 'OPEN'}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>
}

export function BatchStatusBadge({ recalled, expiryDate }: { recalled: boolean; expiryDate: string }) {
  if (recalled) return <Pill tone="red">Recalled</Pill>
  if (new Date(expiryDate) < new Date()) return <Pill tone="amber">Expired</Pill>
  return <Pill tone="green">Active</Pill>
}
