import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Logo mark and wordmark. `dark` is for use on deep-forest surfaces. */
export function Brand({ className, href = '/', dark = false }: { className?: string; href?: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight', dark ? 'text-white' : 'text-brand-900', className)}
    >
      <span
        className={cn(
          'relative grid size-8 place-items-center overflow-hidden rounded-[10px] shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] transition-transform duration-300 group-hover:-rotate-6',
          dark ? 'bg-mint text-brand-800' : 'bg-brand-800 text-mint',
        )}
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <ShieldCheck className="relative size-[18px]" strokeWidth={2.25} />
      </span>
      <span>
        Dawa<span className={dark ? 'text-brand-300' : 'text-brand-600'}>Check</span>
      </span>
    </Link>
  )
}
