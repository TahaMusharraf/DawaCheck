import { MapPin } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { JourneyStep } from '@/lib/types'
import { FALLBACK_STEP, STEP_UI } from './verdict-config'

export function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  return (
    <section
      className="rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-foreground/10 backdrop-blur animate-rise"
      style={{ animationDelay: '240ms' }}
    >
      <h2 className="font-semibold tracking-tight">Supply chain journey</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Every handover is recorded on the Polygon blockchain.</p>

      <ol className="relative mt-5">
        {/* The rail draws itself downward behind the icons. */}
        <span
          aria-hidden
          className="absolute top-5 bottom-5 left-5 w-px origin-top bg-gradient-to-b from-sky-500/60 to-foreground/10 animate-grow-y"
          style={{ animationDelay: '400ms' }}
        />

        {steps.map((s, i) => {
          const { label, Icon } = STEP_UI[s.step] ?? FALLBACK_STEP
          const last = i === steps.length - 1
          return (
            <li
              key={`${s.step}-${i}`}
              className="relative flex gap-4 pb-5 last:pb-0 animate-rise"
              style={{ animationDelay: `${400 + i * 140}ms` }}
            >
              <span
                className={
                  last
                    ? 'relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-sky-600 text-white shadow-sm ring-4 ring-sky-100'
                    : 'relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-card text-sky-700 ring-1 ring-foreground/10'
                }
              >
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{label}</p>
                  <time className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatDate(s.at)}</time>
                </div>
                {s.org && <p className="truncate text-sm text-muted-foreground">{s.org}</p>}
                {s.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {s.city}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
