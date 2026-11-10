'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Ban, Hourglass, LogOut } from 'lucide-react'
import { AmbientBackground } from '@/components/backgrounds/ambient'
import { Brand } from '@/components/brand'
import { AppSidebar, MobileTopbar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth'
import type { Me } from '@/lib/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !me) router.replace('/login')
  }, [loading, me, router])

  if (loading || !me) return <ShellSkeleton />
  if (me.org.status !== 'LICENSED') return <NotLicensed me={me} />

  return (
    <div className="relative isolate min-h-dvh">
      <AmbientBackground fixed />
      <AppSidebar me={me} />
      <MobileTopbar me={me} />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        {/* Keyed by path so each page plays its entrance when you navigate. */}
        <div key={pathname} className="mx-auto max-w-6xl animate-page">
          {children}
        </div>
      </main>
    </div>
  )
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-sidebar p-5 lg:block">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06] animate-breathe" />
        <div className="mt-6 h-14 w-full rounded-xl bg-white/[0.05] animate-breathe" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 w-full rounded-lg bg-white/[0.04] animate-breathe" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
      <div className="px-4 py-6 lg:ml-64 lg:px-10 lg:py-10">
        <Skeleton className="h-9 w-56" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** PENDING orgs wait for the regulator; REVOKED orgs are locked out. The API refuses them either way. */
function NotLicensed({ me }: { me: Me }) {
  const { signOut } = useAuth()
  const pending = me.org.status === 'PENDING'
  const Icon = pending ? Hourglass : Ban

  return (
    <main className="relative isolate grid min-h-dvh place-items-center px-4">
      <AmbientBackground />
      <div className="w-full max-w-md rounded-2xl bg-card/90 p-8 text-center shadow-lift ring-1 ring-ink-900/[0.06] backdrop-blur animate-rise">
        <Brand className="justify-center" />
        <span
          className={
            pending
              ? 'mx-auto mt-8 grid size-16 place-items-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 animate-pop'
              : 'mx-auto mt-8 grid size-16 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-600/20 animate-pop'
          }
        >
          <Icon className="size-7" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          {pending ? 'Application under review' : 'Licence revoked'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {pending
            ? `${me.org.name} has applied. Once the regulator approves it, your licence is written to the blockchain and the dashboard unlocks.`
            : `The regulator has revoked ${me.org.name}'s licence. You can no longer register, receive or dispatch stock.`}
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>
          <LogOut />
          Sign out
        </Button>
      </div>
    </main>
  )
}
