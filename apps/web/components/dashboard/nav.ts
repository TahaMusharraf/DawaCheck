import {
  Boxes,
  Building2,
  LayoutDashboard,
  PackagePlus,
  Radar,
  ScanBarcode,
  ShieldAlert,
  Siren,
  Truck,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { OrgType } from '@/lib/types'

export type NavItem = { href: string; label: string; Icon: LucideIcon; roles: OrgType[] }

const ALL: OrgType[] = ['REGULATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY']

// Order here is the order in the sidebar. Each page also guards its own role.
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard, roles: ALL },
  { href: '/dashboard/organizations', label: 'Organisations', Icon: Building2, roles: ['REGULATOR'] },
  { href: '/dashboard/users', label: 'Users', Icon: Users, roles: ['REGULATOR'] },
  { href: '/dashboard/alerts', label: 'Counterfeit alerts', Icon: Siren, roles: ['REGULATOR'] },
  { href: '/dashboard/analytics', label: 'Scan Radar', Icon: Radar, roles: ['REGULATOR'] },
  { href: '/dashboard/batches', label: 'Batches', Icon: Boxes, roles: ['REGULATOR', 'MANUFACTURER'] },
  { href: '/dashboard/batches/new', label: 'New batch', Icon: PackagePlus, roles: ['MANUFACTURER'] },
  { href: '/dashboard/inventory', label: 'Inventory', Icon: Warehouse, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'] },
  { href: '/dashboard/dispatch', label: 'Dispatch', Icon: Truck, roles: ['MANUFACTURER', 'DISTRIBUTOR'] },
  { href: '/dashboard/sell', label: 'Sell a pack', Icon: ScanBarcode, roles: ['PHARMACY'] },
  { href: '/dashboard/recalls', label: 'Recalls', Icon: ShieldAlert, roles: ALL },
  { href: '/dashboard/account', label: 'Account', Icon: UserCog, roles: ALL },
]

export const ORG_LABEL: Record<OrgType, string> = {
  REGULATOR: 'Regulator',
  MANUFACTURER: 'Manufacturer',
  DISTRIBUTOR: 'Distributor',
  PHARMACY: 'Pharmacy',
}

/** The most specific nav item that matches the path, so /batches/new doesn't also light up /batches. */
export function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}
