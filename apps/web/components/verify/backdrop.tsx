import { cn } from '@/lib/utils'
import type { Tone } from './verdict-config'

/** Dot grid plus two slow-drifting glows tinted with the verdict's colour. */
export function Backdrop({ tone }: { tone: Tone }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-[length:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div
        className={cn(
          'absolute -top-40 left-1/2 size-[30rem] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-1000 animate-drift lg:-top-64 lg:left-1/3 lg:size-[48rem]',
          tone.glow,
        )}
      />
      <div
        className={cn(
          'absolute top-1/3 -right-40 size-80 rounded-full blur-3xl transition-colors duration-1000 animate-drift-slow lg:size-[36rem]',
          tone.glow,
        )}
      />
    </div>
  )
}
