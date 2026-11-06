import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
        <ShieldCheck className="size-4" />
      </span>
      DawaCheck
    </Link>
  )
}
