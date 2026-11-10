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

export type NavGroup = 'Workspace' | 'Oversight' | 'Supply chain' | 'Settings'
export type NavItem = { href: string; label: string; Icon: LucideIcon; roles: OrgType[]; group: NavGroup }

const ALL: OrgType[] = ['REGULATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY']

// Order here is the order in the sidebar, grouped under `group`. Each page also guards its own role.
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard, roles: ALL, group: 'Workspace' },
  { href: '/dashboard/organizations', label: 'Organisations', Icon: Building2, roles: ['REGULATOR'], group: 'Oversight' },
  { href: '/dashboard/users', label: 'Users', Icon: Users, roles: ['REGULATOR'], group: 'Oversight' },
  { href: '/dashboard/alerts', label: 'Counterfeit alerts', Icon: Siren, roles: ['REGULATOR'], group: 'Oversight' },
  { href: '/dashboard/analytics', label: 'Scan Radar', Icon: Radar, roles: ['REGULATOR'], group: 'Oversight' },
  { href: '/dashboard/batches', label: 'Batches', Icon: Boxes, roles: ['REGULATOR', 'MANUFACTURER'], group: 'Supply chain' },
  { href: '/dashboard/batches/new', label: 'New batch', Icon: PackagePlus, roles: ['MANUFACTURER'], group: 'Supply chain' },
  { href: '/dashboard/inventory', label: 'Inventory', Icon: Warehouse, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'], group: 'Supply chain' },
  { href: '/dashboard/dispatch', label: 'Dispatch', Icon: Truck, roles: ['MANUFACTURER', 'DISTRIBUTOR'], group: 'Supply chain' },
  { href: '/dashboard/sell', label: 'Sell a pack', Icon: ScanBarcode, roles: ['PHARMACY'], group: 'Supply chain' },
  { href: '/dashboard/recalls', label: 'Recalls', Icon: ShieldAlert, roles: ALL, group: 'Supply chain' },
  { href: '/dashboard/account', label: 'Account', Icon: UserCog, roles: ALL, group: 'Settings' },
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

/** The nav item for the current page, used for page eyebrows. */
export function currentItem(pathname: string): NavItem | undefined {
  const href = activeHref(pathname, NAV)
  return NAV.find((i) => i.href === href)
}
