'use client'

import { useEffect, useState } from 'react'
import { Check, LoaderCircle, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

// The same order the API works in: hash the code, read the chain, score the scan.
const STAGES = ['Reading the pack code', 'Checking the blockchain', 'Analysing scan history']

export function VerifyLoading() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-foreground/10 backdrop-blur animate-rise">
      <div className="relative mx-auto size-24 overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <ScanLine className="absolute inset-0 m-auto size-12 text-muted-foreground/40" strokeWidth={1.25} />
        <div className="absolute inset-x-2 top-2 h-0.5 rounded-full bg-sky-500 shadow-[0_0_12px_2px] shadow-sky-400/60 animate-scan" />
      </div>

      <p className="mt-5 text-center text-sm font-medium">Verifying this pack…</p>

      <ol className="mt-5 space-y-3">
        {STAGES.map((label, i) => {
          const done = i < stage
          const active = i === stage
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 text-sm transition-colors duration-300',
                done || active ? 'text-foreground' : 'text-muted-foreground/60',
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full ring-1 transition-colors duration-300',
                  done ? 'bg-emerald-500 text-white ring-emerald-500' : 'ring-foreground/15',
                )}
              >
                {done && <Check className="size-3" strokeWidth={3} />}
                {active && <LoaderCircle className="size-3 animate-spin text-sky-600" />}
              </span>
              {label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
