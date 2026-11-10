'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Menu, ScanLine } from 'lucide-react'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Me } from '@/lib/types'
import { activeHref, NAV, ORG_LABEL, type NavGroup } from './nav'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

function SidebarBody({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const items = NAV.filter((i) => i.roles.includes(me.org.type))
  const active = activeHref(pathname, items)
  const groups = [...new Set(items.map((i) => i.group))] as NavGroup[]

  return (
    <div className="grain relative isolate flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Slow glows behind the nav so the dark surface isn't flat. */}
      <div aria-hidden className="absolute -top-24 -left-20 -z-10 size-72 rounded-full bg-brand-600/30 blur-3xl animate-drift" />
      <div aria-hidden className="absolute -bottom-32 -right-24 -z-10 size-72 rounded-full bg-brand-400/15 blur-3xl animate-drift-slow" />

      <div className="px-5 pt-5 pb-5">
        <Brand href="/dashboard" dark />
      </div>

      <div className="mx-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/[0.06]">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white shadow-inner">
          {initials(me.org.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{me.org.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-brand-200/70">
            <span className="size-1.5 rounded-full bg-brand-400 animate-breathe" />
            {ORG_LABEL[me.org.type]}
          </p>
        </div>
      </div>

      <nav className="scrollbar-thin mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.14em] text-brand-200/45 uppercase">{group}</p>
            <div className="space-y-0.5">
              {items
                .filter((i) => i.group === group)
                .map(({ href, label, Icon }) => {
                  const on = href === active
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-200',
                        on ? 'text-white' : 'text-sidebar-foreground/75 hover:text-white',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-0 rounded-lg transition-all duration-300 ease-out',
                          on ? 'scale-100 bg-white/[0.08] ring-1 ring-white/[0.08]' : 'scale-95 bg-white/0 group-hover:scale-100 group-hover:bg-white/[0.04]',
                        )}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-mint shadow-[0_0_12px_rgb(205_255_220/0.8)] transition-transform duration-300 ease-out',
                          on ? 'scale-y-100' : 'scale-y-0',
                        )}
                      />
                      <Icon className={cn('relative size-4 shrink-0 transition-colors', on ? 'text-mint' : 'text-brand-200/60 group-hover:text-brand-200')} />
                      <span className="relative">{label}</span>
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <Link
          href="/scan"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-sidebar-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <ScanLine className="size-4 text-brand-200/60" />
          Verify a pack
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-[11px] font-semibold text-brand-800 uppercase">
            {me.email.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/70">{me.email}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={signOut}
            aria-label="Sign out"
            className="text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ me }: { me: Me }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <SidebarBody me={me} />
    </aside>
  )
}

export function MobileTopbar({ me }: { me: Me }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-brand-900/95 px-4 backdrop-blur lg:hidden">
      <Brand href="/dashboard" dark />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="text-white hover:bg-white/10 hover:text-white"
      >
        <Menu />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody me={me} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
