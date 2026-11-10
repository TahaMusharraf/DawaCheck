import {
  CalendarX2,
  Copy,
  Factory,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ShoppingBag,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { Verdict } from '@/lib/types'

// Full class names are written out so Tailwind can find them when it scans the source.
export type Tone = {
  text: string
  soft: string
  ring: string
  solid: string
  glow: string
  /** Aurora palette [base, body, highlight, ribbon] that tints the page background. */
  aurora: [string, string, string, string]
}

export const TONES = {
  green: {
    text: 'text-brand-700',
    soft: 'bg-brand-50',
    ring: 'ring-brand-600/20',
    solid: 'bg-brand-500',
    glow: 'bg-brand-400/25',
    aurora: ['#f6f8f3', '#e1f3e6', '#cdffdc', '#68ba7f'],
  },
  red: {
    text: 'text-red-700',
    soft: 'bg-red-50',
    ring: 'ring-red-600/20',
    solid: 'bg-red-500',
    glow: 'bg-red-400/25',
    aurora: ['#faf6f3', '#fbe7e2', '#f6d2c9', '#e3907f'],
  },
  amber: {
    text: 'text-amber-700',
    soft: 'bg-amber-50',
    ring: 'ring-amber-600/25',
    solid: 'bg-amber-500',
    glow: 'bg-amber-400/25',
    aurora: ['#faf8f1', '#fbefd6', '#f6e2b0', '#dcb35f'],
  },
  orange: {
    text: 'text-orange-700',
    soft: 'bg-orange-50',
    ring: 'ring-orange-600/25',
    solid: 'bg-orange-500',
    glow: 'bg-orange-400/25',
    aurora: ['#faf7f2', '#fbeadb', '#f7d9bd', '#e2a06a'],
  },
  neutral: {
    text: 'text-ink-700',
    soft: 'bg-ink-50',
    ring: 'ring-ink-600/15',
    solid: 'bg-ink-400',
    glow: 'bg-brand-300/20',
    aurora: ['#f6f8f3', '#e4f4e8', '#cdffdc', '#93cfa5'],
  },
} satisfies Record<string, Tone>

type VerdictUi = {
  eyebrow: string
  title: string
  desc: string
  advice?: string
  Icon: LucideIcon
  tone: Tone
}

export const VERDICT_UI: Record<Verdict, VerdictUi> = {
  AUTHENTIC: {
    eyebrow: 'Verified',
    title: 'Genuine medicine',
    desc: 'This pack was registered on the blockchain by a licensed manufacturer and shows no signs of copying.',
    Icon: ShieldCheck,
    tone: TONES.green,
  },
  NOT_REGISTERED: {
    eyebrow: 'Not registered',
    title: 'Possible counterfeit',
    desc: 'This code was never issued by a licensed manufacturer.',
    advice: 'Do not use this medicine. Return it to where you bought it and report it to DRAP.',
    Icon: ShieldX,
    tone: TONES.red,
  },
  RECALLED: {
    eyebrow: 'Recalled',
    title: 'This batch has been recalled',
    desc: 'The regulator has withdrawn this batch from the market.',
    advice: 'Do not use this medicine. Return it to your pharmacy.',
    Icon: ShieldAlert,
    tone: TONES.red,
  },
  EXPIRED: {
    eyebrow: 'Expired',
    title: 'This medicine has expired',
    desc: 'The pack is genuine, but it is past its expiry date.',
    advice: 'Do not use expired medicine. Dispose of it safely or return it to a pharmacy.',
    Icon: CalendarX2,
    tone: TONES.amber,
  },
  CLONE_SUSPECTED: {
    eyebrow: 'Suspicious',
    title: 'This code may be copied',
    desc: "The code is genuine, but its scan history doesn't match a single pack. The label may have been cloned.",
    advice: 'Check the packaging carefully and buy only from a licensed pharmacy. This scan has been reported.',
    Icon: Copy,
    tone: TONES.orange,
  },
}

export const STEP_UI: Record<string, { label: string; Icon: LucideIcon }> = {
  MANUFACTURED: { label: 'Manufactured', Icon: Factory },
  DISTRIBUTOR: { label: 'Received by distributor', Icon: Truck },
  PHARMACY: { label: 'Received by pharmacy', Icon: Store },
  SOLD: { label: 'Sold to patient', Icon: ShoppingBag },
}

export const FALLBACK_STEP = { label: 'Handover', Icon: MapPin }
