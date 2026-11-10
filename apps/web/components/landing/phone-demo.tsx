'use client'

import { useEffect, useState } from 'react'
import { Check, Factory, LoaderCircle, MapPin, ShieldCheck, Store, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'scan' | 'verify' | 'result'
const DURATION: Record<Phase, number> = { scan: 2600, verify: 1800, result: 4200 }
const NEXT: Record<Phase, Phase> = { scan: 'verify', verify: 'result', result: 'scan' }

/** A looping, self-playing picture of a scan: camera → checking → verdict. */
export function PhoneDemo() {
  const [phase, setPhase] = useState<Phase>('scan')

  useEffect(() => {
    const t = setTimeout(() => setPhase(NEXT[phase]), DURATION[phase])
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="relative mx-auto w-full max-w-[19rem] text-foreground">
      {/* Soft floor shadow + orbiting chips make the phone feel placed, not pasted. */}
      <div aria-hidden className="absolute inset-x-8 -bottom-6 h-10 rounded-full bg-ink-900/20 blur-2xl" />
      <FloatingChip className="top-16 -left-20 hidden sm:flex" delay="0s">
        <span className="size-2 rounded-full bg-brand-500" /> Proof matches chain
      </FloatingChip>
      <FloatingChip className="top-1/2 -right-24 hidden sm:flex" delay="1.5s">
        <span className="size-2 rounded-full bg-brand-500" /> 3 handovers on-chain
      </FloatingChip>
      <FloatingChip className="bottom-20 -left-16 hidden sm:flex" delay="3s">
        <span className="size-2 rounded-full bg-amber-500" /> 0 clone flags
      </FloatingChip>

      <div className="animate-float rounded-[2.75rem] bg-ink-950 p-3 shadow-2xl ring-1 ring-ink-800">
        <div className="relative h-[33rem] overflow-hidden rounded-[2.1rem] bg-background">
          <div className="absolute top-3 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-950" />

          {/* Camera */}
          <Screen active={phase === 'scan'} className="bg-ink-900">
            <div className="grid h-full place-items-center">
              <div className="relative size-48">
                <FakeQr />
                <Corners />
                <span className="absolute inset-x-2 top-2 h-0.5 rounded-full bg-brand-400 shadow-[0_0_14px_3px] shadow-brand-400/70 animate-scan-tall" />
              </div>
            </div>
            <p className="absolute inset-x-0 bottom-10 text-center text-sm text-ink-300">Point at the QR on the pack</p>
          </Screen>

          {/* Checking */}
          <Screen active={phase === 'verify'}>
            <div className="flex h-full flex-col items-center justify-center gap-6 px-8">
              <LoaderCircle className="size-10 animate-spin text-brand-600" />
              <ul className="w-full space-y-3 text-sm">
                {['Reading the pack code', 'Checking the blockchain', 'Analysing scan history'].map((t, i) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 opacity-0 animate-rise"
                    style={{ animationDelay: phase === 'verify' ? `${i * 450}ms` : '0ms' }}
                  >
                    <span className="grid size-5 place-items-center rounded-full bg-brand-500 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Screen>

          {/* Verdict */}
          <Screen active={phase === 'result'}>
            <div aria-hidden className="absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-400/25 blur-3xl" />
            <div className="relative space-y-3 p-4 pt-12">
              <div className="rounded-2xl bg-card/90 p-5 text-center ring-1 ring-foreground/10">
                <div className="relative mx-auto grid size-14 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-brand-500 animate-pulse-ring" />
                  <span key={phase} className="relative grid size-14 place-items-center rounded-full bg-brand-50 ring-1 ring-brand-600/20 animate-pop">
                    <ShieldCheck className="size-7 text-brand-700" strokeWidth={1.75} />
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-brand-700 uppercase">Verified</p>
                <p className="text-lg font-semibold tracking-tight">Genuine medicine</p>
                <p className="mt-1 text-xs text-muted-foreground">Registered by a licensed manufacturer</p>
              </div>
              <div className="rounded-2xl bg-card/90 p-4 ring-1 ring-foreground/10">
                <p className="text-sm font-semibold">Panadol 500 mg</p>
                <p className="text-xs text-muted-foreground">Batch P-2611 · Expires Dec 2027</p>
                <ol className="relative mt-3 space-y-2.5">
                  {[
                    { Icon: Factory, label: 'Manufactured', city: 'Karachi' },
                    { Icon: Truck, label: 'Distributor', city: 'Lahore' },
                    { Icon: Store, label: 'Pharmacy', city: 'Rawalpindi' },
                  ].map(({ Icon, label, city }, i, all) => (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 opacity-0 animate-rise"
                      style={{ animationDelay: phase === 'result' ? `${300 + i * 160}ms` : '0ms' }}
                    >
                      <span className={cn('grid size-7 place-items-center rounded-full', i === all.length - 1 ? 'bg-brand-600 text-white' : 'bg-muted text-brand-700')}>
                        <Icon className="size-3.5" />
                      </span>
                      <span className="text-xs font-medium">{label}</span>
                      <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {city}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Screen>
        </div>
      </div>
    </div>
  )
}

function Screen({ active, className, children }: { active: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!active}
      className={cn(
        'absolute inset-0 transition-all duration-500 ease-out',
        active ? 'scale-100 opacity-100' : 'pointer-events-none scale-[0.97] opacity-0',
        className,
      )}
    >
      {/* Remount on activation so the staggered entrance replays every loop. */}
      {active && children}
    </div>
  )
}

function FloatingChip({ className, delay, children }: { className?: string; delay: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'absolute z-10 items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg ring-1 ring-foreground/10 backdrop-blur animate-float',
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  )
}

function Corners() {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-3">
      <span className="absolute top-0 left-0 size-7 rounded-tl-xl border-t-4 border-l-4 border-white" />
      <span className="absolute top-0 right-0 size-7 rounded-tr-xl border-t-4 border-r-4 border-white" />
      <span className="absolute bottom-0 left-0 size-7 rounded-bl-xl border-b-4 border-l-4 border-white" />
      <span className="absolute right-0 bottom-0 size-7 rounded-br-xl border-r-4 border-b-4 border-white" />
    </div>
  )
}

// A decorative QR-like pattern: fixed pseudo-random modules plus the three finder squares.
const N = 21
const MODULES = Array.from({ length: N * N }, (_, i) => ((i * 7919 + 104729) % 13) % 3 === 0)

function inFinder(x: number, y: number) {
  const near = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7
  return near(0, 0) || near(N - 7, 0) || near(0, N - 7)
}

function FakeQr() {
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="size-full rounded-md bg-white p-2" shapeRendering="crispEdges">
      {MODULES.map((on, i) => {
        const x = i % N
        const y = Math.floor(i / N)
        return on && !inFinder(x, y) ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0f172a" /> : null
      })}
      {[
        [0, 0],
        [N - 7, 0],
        [0, N - 7],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} fill="#0f172a">
          <rect x={x} y={y} width={7} height={7} />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} />
        </g>
      ))}
    </svg>
  )
}
