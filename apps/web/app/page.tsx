import Link from 'next/link'
import {
  ArrowRight,
  Blocks,
  Database,
  Factory,
  MapPin,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Backdrop } from '@/components/verify/backdrop'
import { TONES, VERDICT_UI } from '@/components/verify/verdict-config'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/types'

const STEPS = [
  { Icon: Factory, title: 'Register', text: 'The manufacturer creates a batch. Only one 32-byte Merkle root goes on-chain for thousands of packs.' },
  { Icon: Truck, title: 'Track', text: 'Every handover, factory to distributor to pharmacy, is an on-chain custody transfer.' },
  { Icon: ScanLine, title: 'Verify', text: 'Anyone scans the QR. The proof is checked against the chain and the scan history is scored.' },
  { Icon: ShieldAlert, title: 'Recall', text: 'The regulator recalls a batch in one transaction. Every scan shows it within seconds.' },
]

const ON_CHAIN = ['Organisation licences', 'Batch Merkle roots and expiry', 'Custody transfers', 'Recall flags']
const OFF_CHAIN = ['Drug names and company details', 'Merkle proofs per pack', 'Scan events and rough location', 'Counterfeit alerts']

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      <Backdrop tone={TONES.neutral} />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8 animate-rise">
        <Brand />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <a href="#how">How it works</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/scan">
              <ScanLine />
              Scan
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Verified on Polygon · No app, no login
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Know the medicine in your hand is real.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Every DawaCheck pack carries a code registered on a public blockchain by a licensed manufacturer. Scan it and see
            where it came from in about two seconds.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-6 text-base" asChild>
              <Link href="/scan">
                <ScanLine />
                Scan a pack
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 bg-card/60 px-6 text-base backdrop-blur" asChild>
              <Link href="/apply">
                For organisations
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <p className="mt-10 max-w-md border-l-2 border-foreground/15 pl-4 text-sm text-muted-foreground">
            The WHO estimates roughly <span className="font-semibold text-foreground">1 in 10</span> medical products in low- and
            middle-income countries is substandard or falsified.
          </p>
        </div>

        <PhoneMock />
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance">
            From the factory floor to the pharmacy counter, every step leaves a public record.
          </h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="group relative rounded-2xl bg-background p-6 ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
                <span className="absolute top-6 right-6 font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-600/15 transition-transform group-hover:-translate-y-0.5">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Verdicts */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">Five possible answers</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">A scan never says &ldquo;maybe&rdquo;.</h2>
            <p className="mt-4 text-muted-foreground">
              A copied QR still passes the blockchain check, so each scan is also scored against the pack&apos;s own history:
              impossible travel, spread across cities, scans outside the custody path.
            </p>
          </div>
          <ul className="divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
            {(Object.keys(VERDICT_UI) as Verdict[]).map((v) => {
              const { eyebrow, desc, Icon, tone } = VERDICT_UI[v]
              return (
                <li key={v} className="flex gap-4 p-5">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full ring-1', tone.soft, tone.ring)}>
                    <Icon className={cn('size-5', tone.text)} />
                  </span>
                  <div>
                    <p className={cn('text-sm font-semibold', tone.text)}>{eyebrow}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* On-chain vs off-chain */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <DataColumn Icon={Blocks} title="On the blockchain" subtitle="Public and permanent. Even we can't change it." items={ON_CHAIN} tone="sky" />
          <DataColumn Icon={Database} title="Off the blockchain" subtitle="Private, in a normal database. No patient data, ever." items={OFF_CHAIN} tone="slate" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-center text-white sm:px-12">
          <div aria-hidden className="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl animate-drift" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance">Manufacturer, distributor or pharmacy?</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-slate-300">
            Apply once. After the regulator approves you, your licence is written on-chain and you can register and move stock.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 bg-white px-6 text-slate-950 hover:bg-white/90" asChild>
              <Link href="/apply">Apply for a licence</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <Brand />
          <p>Blockchain-based fake medicine detection.</p>
        </div>
      </footer>
    </div>
  )
}

function DataColumn({
  Icon,
  title,
  subtitle,
  items,
  tone,
}: {
  Icon: typeof Blocks
  title: string
  subtitle: string
  items: string[]
  tone: 'sky' | 'slate'
}) {
  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <span
        className={cn(
          'grid size-10 place-items-center rounded-xl ring-1',
          tone === 'sky' ? 'bg-sky-50 text-sky-700 ring-sky-600/15' : 'bg-slate-100 text-slate-700 ring-slate-500/15',
        )}
      >
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm">
            <span className={cn('size-1.5 rounded-full', tone === 'sky' ? 'bg-sky-500' : 'bg-slate-400')} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A static picture of the verification screen, so the hero shows the product itself. */
function PhoneMock() {
  const steps = [
    { Icon: Factory, label: 'Manufactured', org: 'Karachi' },
    { Icon: Truck, label: 'Distributor', org: 'Lahore' },
    { Icon: Store, label: 'Pharmacy', org: 'Lahore' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-[20rem] animate-rise" style={{ animationDelay: '150ms' }}>
      <div className="animate-float">
        <div className="rounded-[2.75rem] bg-slate-950 p-3 shadow-2xl ring-1 ring-slate-800">
          <div className="overflow-hidden rounded-[2.1rem] bg-background">
            <div className="mx-auto mt-3 h-5 w-24 rounded-full bg-slate-950" />
            <div className="space-y-3 p-4">
              <div className="rounded-2xl bg-card p-5 text-center ring-1 ring-foreground/10">
                <div className="relative mx-auto grid size-14 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse-ring" />
                  <span className="relative grid size-14 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-600/20">
                    <ShieldCheck className="size-7 text-emerald-700" strokeWidth={1.75} />
                  </span>
                </div>
                <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">Verified</p>
                <p className="text-lg font-semibold tracking-tight">Genuine medicine</p>
              </div>
              <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="text-sm font-semibold">Panadol 500 mg</p>
                <p className="text-xs text-muted-foreground">Batch P-2611 · Exp Dec 2027</p>
                <ol className="mt-3 space-y-2.5">
                  {steps.map(({ Icon, label, org }, i) => (
                    <li key={label} className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'grid size-7 place-items-center rounded-full',
                          i === steps.length - 1 ? 'bg-sky-600 text-white' : 'bg-muted text-sky-700',
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="text-xs font-medium">{label}</span>
                      <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {org}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
