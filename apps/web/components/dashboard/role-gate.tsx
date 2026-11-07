'use client'

import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { OrgType } from '@/lib/types'
import { EmptyState, Panel } from './ui'

/** Shows children only to the listed org types. The API enforces this too; this just avoids a page of 403s. */
export function RoleGate({ roles, children }: { roles: OrgType[]; children: React.ReactNode }) {
  const { me } = useAuth()
  if (!me) return null
  if (!roles.includes(me.org.type)) {
    return (
      <Panel>
        <EmptyState Icon={Lock} title="Not available for your organisation" description="This page belongs to a different role." />
      </Panel>
    )
  }
  return <>{children}</>
}
