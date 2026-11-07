'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Hourglass, LogOut } from 'lucide-react'
import { Brand } from '@/components/brand'
import { AppSidebar, MobileTopbar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth'
import type { Me } from '@/lib/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !me) router.replace('/login')
  }, [loading, me, router])

  if (loading || !me) return <ShellSkeleton />
  if (me.org.status !== 'LICENSED') return <NotLicensed me={me} />

  return (
    <div className="min-h-dvh bg-muted/40">
      <AppSidebar me={me} />
      <MobileTopbar me={me} />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-muted/40">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background p-5 lg:block">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-6 h-14 w-full rounded-xl" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
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
    <main className="grid min-h-dvh place-items-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-foreground/10 animate-rise">
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
