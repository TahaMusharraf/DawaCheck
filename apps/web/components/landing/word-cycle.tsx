'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Rotates through words in place. All words share one grid cell, so the
 * line keeps the width of the longest word and nothing around it jumps.
 */
export function WordCycle({ words, interval = 2400, className }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [words.length, interval])

  return (
    <span className={cn('inline-grid', className)}>
      {words.map((w, n) => (
        <span
          key={w}
          aria-hidden={n !== i}
          className={cn(
            'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [grid-area:1/1]',
            n === i ? 'translate-y-0 opacity-100 blur-0' : n === (i + words.length - 1) % words.length ? '-translate-y-3 opacity-0 blur-sm' : 'translate-y-3 opacity-0 blur-sm',
          )}
        >
          {w}
        </span>
      ))}
    </span>
  )
}
