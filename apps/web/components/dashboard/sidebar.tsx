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
import { activeHref, NAV, ORG_LABEL } from './nav'

function SidebarBody({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const items = NAV.filter((i) => i.roles.includes(me.org.type))
  const active = activeHref(pathname, items)

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Brand href="/dashboard" />
      </div>

      <div className="mx-3 rounded-xl bg-muted/60 px-3 py-2.5 ring-1 ring-foreground/5">
        <p className="truncate text-sm font-medium">{me.org.name}</p>
        <p className="text-xs text-muted-foreground">{ORG_LABEL[me.org.type]}</p>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              href === active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t p-3">
        <Link
          href="/scan"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ScanLine className="size-4" />
          Verify a pack
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800 uppercase">
            {me.email.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{me.email}</span>
          <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ me }: { me: Me }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
      <SidebarBody me={me} />
    </aside>
  )
}

export function MobileTopbar({ me }: { me: Me }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
      <Brand href="/dashboard" />
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody me={me} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
