import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScanRisk, Verdict } from '@/lib/types'
import { VERDICT_UI } from './verdict-config'

export function VerdictHero({ verdict, risk }: { verdict: Verdict; risk?: ScanRisk }) {
  const { eyebrow, title, desc, advice, Icon, tone } = VERDICT_UI[verdict]

  return (
    <section className="relative overflow-hidden rounded-2xl bg-card/80 p-6 text-center shadow-sm ring-1 ring-foreground/10 backdrop-blur animate-rise lg:p-10">
      <div className="relative mx-auto grid size-20 place-items-center lg:size-24">
        <span className={cn('absolute inset-0 rounded-full animate-pulse-ring', tone.solid)} />
        <span
          className={cn('absolute inset-0 rounded-full animate-pulse-ring', tone.solid)}
          style={{ animationDelay: '1.2s' }}
        />
        <div className={cn('relative grid size-20 place-items-center rounded-full ring-1 animate-pop lg:size-24', tone.soft, tone.ring)}>
          <Icon className={cn('size-10 lg:size-12', tone.text)} strokeWidth={1.75} />
        </div>
      </div>

      <p className={cn('mt-6 text-xs font-semibold uppercase tracking-[0.18em] lg:mt-8', tone.text)}>{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground text-balance lg:max-w-sm lg:text-base">{desc}</p>

      {advice && (
        <p className={cn('mt-5 rounded-lg px-4 py-3 text-left text-sm font-medium ring-1', tone.soft, tone.text, tone.ring)}>
          {advice}
        </p>
      )}

      {verdict === 'AUTHENTIC' && risk?.warning && (
        <p className="mt-5 flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 ring-1 ring-amber-600/20">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          This code has been scanned in an unusual pattern. If the packaging looks tampered with, report it.
        </p>
      )}
    </section>
  )
}
