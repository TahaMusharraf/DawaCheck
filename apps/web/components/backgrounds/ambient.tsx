import { cn } from '@/lib/utils'
import { Aurora, type AuroraColors } from './aurora'
import { Particles } from './particles'

const PALETTES: Record<'light' | 'dark', { aurora: AuroraColors; mote: string; base: string }> = {
  // Ivory into mint and sage: present enough to notice, soft enough to read on.
  light: {
    aurora: ['#f2f7ef', '#d9efdf', '#bff0cd', '#7fc795'],
    mote: '#4a9b61',
    base: 'bg-[radial-gradient(ellipse_at_top,#dcf1e2,#f6f8f3_60%)]',
  },
  // Deep forest with forest-green swells and a sage ribbon.
  dark: {
    aurora: ['#0f1c13', '#1d3a27', '#2e6f40', '#8fd3a5'],
    mote: '#cdffdc',
    base: 'bg-[radial-gradient(ellipse_at_top,#1f3a28,#0f1c13_65%)]',
  },
}

/**
 * The layered animated background: a CSS gradient (shown instantly, and the fallback when
 * WebGL is unavailable), the flowing aurora shader, slow glowing orbs, a dot lattice with a
 * wandering spotlight, drifting motes, and film grain on top.
 * Absolutely positioned: put it inside a `relative isolate` parent, or pass `fixed`.
 */
export function AmbientBackground({
  variant = 'light',
  particles = true,
  fixed = false,
  colors,
  className,
}: {
  variant?: 'light' | 'dark'
  particles?: boolean
  fixed?: boolean
  /** Overrides the aurora palette, e.g. to tint the verify page with its verdict. */
  colors?: AuroraColors
  className?: string
}) {
  const palette = PALETTES[variant]
  const light = variant === 'light'
  return (
    <div
      aria-hidden
      className={cn(
        'grain pointer-events-none inset-0 -z-10 overflow-hidden',
        fixed ? 'fixed' : 'absolute',
        palette.base,
        className,
      )}
    >
      <Aurora colors={colors ?? palette.aurora} className="absolute inset-0" />

      {/* Orbs: big, blurred and slow. They give the light theme visible depth and colour. */}
      <div
        className={cn(
          'absolute -top-32 -left-24 size-[34rem] rounded-full blur-3xl animate-drift',
          light ? 'bg-brand-300/35' : 'bg-brand-500/20',
        )}
      />
      <div
        className={cn(
          'absolute top-1/3 -right-32 size-[30rem] rounded-full blur-3xl animate-drift-slow',
          light ? 'bg-mint/70' : 'bg-brand-400/10',
        )}
      />
      <div
        className={cn(
          'absolute -bottom-40 left-1/3 size-[28rem] rounded-full blur-3xl animate-drift',
          light ? 'bg-brand-200/40' : 'bg-brand-600/20',
        )}
        style={{ animationDelay: '-9s' }}
      />

      <div className={cn('dot-field absolute inset-0', !light && 'dot-field-dark')} />
      {light && <div className="dot-spotlight absolute inset-0" />}

      {particles && <Particles color={palette.mote} density={light ? 0.9 : 1} className="absolute inset-0 opacity-80" />}
    </div>
  )
}
