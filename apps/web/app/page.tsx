import Link from 'next/link'
import {
  ArrowRight,
  Blocks,
  Building2,
  Check,
  ChevronDown,
  Database,
  Factory,
  Fingerprint,
  Landmark,
  Newspaper,
  ScanLine,
  ShieldAlert,
  Stamp,
  Store,
  Truck,
  User,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { CountUp } from '@/components/landing/count-up'
import { PhoneDemo } from '@/components/landing/phone-demo'
import { Reveal } from '@/components/landing/reveal'
import { WordCycle } from '@/components/landing/word-cycle'
import { Button } from '@/components/ui/button'
import { Backdrop } from '@/components/verify/backdrop'
import { TONES, VERDICT_UI } from '@/components/verify/verdict-config'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/types'

const TICKER = [
  'Registered on Polygon',
  'Merkle-proof verified',
  'Recalls in one transaction',
  'Clone detection on every scan',
  'No patient data on-chain',
  'Works with any phone camera',
  'Licensed parties only',
  'Every handover recorded',
]

const PROBLEMS = [
  { Icon: Stamp, was: 'Holograms and scratch codes', why: 'Counterfeiters copy them within weeks, including the SMS number to "verify" with.', fix: 'Codes are checked against a public chain, not a printed promise.' },
  { Icon: Database, was: 'Each company’s own database', why: 'Competitors won’t trust it, and whoever runs the server can quietly edit it.', fix: 'One shared record that nobody, including us, can rewrite.' },
  { Icon: Newspaper, was: 'Recalls in the newspaper', why: 'A bad batch keeps selling for weeks because the counter never hears about it.', fix: 'A recall reaches every scan of the batch within seconds.' },
  { Icon: Truck, was: 'No chain of custody', why: 'Once a pack leaves the factory its journey is invisible, so fakes slip in unnoticed.', fix: 'Every handover is a signed, timestamped, on-chain transfer.' },
]

const STEPS = [
  { Icon: Factory, title: 'Register', text: 'A licensed manufacturer creates a batch. One 32-byte fingerprint goes on-chain for up to 5,000 packs.' },
  { Icon: Truck, title: 'Track', text: 'Factory to distributor to pharmacy: each handover is recorded as an on-chain custody transfer.' },
  { Icon: ScanLine, title: 'Verify', text: 'Anyone scans the QR. The code is proven against the chain and its scan history is checked for copying.' },
  { Icon: ShieldAlert, title: 'Recall', text: 'The regulator recalls a batch in a single transaction, and every scan of it says so immediately.' },
]

const AUDIENCE = [
  { Icon: User, who: 'Patients & inspectors', gets: 'Scan with your phone camera. No app, no account, no cost. A clear answer in seconds.' },
  { Icon: Store, who: 'Pharmacies', gets: 'Accept stock only from licensed suppliers, mark packs sold, and see recalls the moment they happen.' },
  { Icon: Factory, who: 'Manufacturers & distributors', gets: 'Register batches, print QR labels, and prove every shipment you hand over.' },
  { Icon: Landmark, who: 'The regulator', gets: 'License organisations, recall batches, and watch counterfeit alerts across the country.' },
]

const FAQ = [
  {
    q: 'Can’t a counterfeiter just photocopy a real QR code?',
    a: 'They can, and the blockchain alone can’t stop that. That’s why every scan is also scored against the pack’s own history: the same code in two cities an hour apart, on many different phones, or outside its custody path. A copied label produces a pattern a single genuine pack never does, and it’s flagged as suspicious.',
  },
  {
    q: 'Do I need a crypto wallet or any app?',
    a: 'No. Checking a pack is a free read from the blockchain, done by our server for you. Organisations get a wallet that is created and held for them, so they sign in with email and password like any other website.',
  },
  {
    q: 'What if I scan my own medicine twice?',
    a: 'That’s normal and fine. The system looks at a weighted score across devices, distance and custody, not at a single repeat scan.',
  },
  {
    q: 'Is my data put on the blockchain?',
    a: 'Never. Only licences, batch fingerprints, custody transfers and recall flags go on-chain. Scan events and locations stay in a private database, stored coarsely and without names.',
  },
]

export default function Home() {
  return (
    <div className="relative isolate overflow-x-clip">
      <Backdrop tone={TONES.neutral} />

      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Brand />
          <nav className="flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1 md:flex">
              {[
                ['How it works', '#how'],
                ['Who it’s for', '#who'],
                ['FAQ', '#faq'],
              ].map(([label, href]) => (
                <Button key={href} variant="ghost" size="sm" asChild>
                  <a href={href}>{label}</a>
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/scan">
                <ScanLine />
                Scan a pack
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-16 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 backdrop-blur animate-rise">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse-ring" />
              <span className="relative size-2 rounded-full bg-emerald-500" />
            </span>
            Live on the Polygon blockchain
          </p>
          <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl animate-rise" style={{ animationDelay: '80ms' }}>
            Know your medicine is{' '}
            <WordCycle words={['genuine.', 'not expired.', 'not recalled.', 'not a copy.']} className="text-sky-700" />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-rise" style={{ animationDelay: '160ms' }}>
            DawaCheck gives every medicine pack an identity that can&apos;t be forged or edited. Point your camera at the QR
            code and in about two seconds you&apos;ll see who made it, where it has been, and whether it is safe to use.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-rise" style={{ animationDelay: '240ms' }}>
            <Button size="lg" className="group h-12 px-6 text-base shadow-lg shadow-slate-900/10" asChild>
              <Link href="/scan">
                <ScanLine />
                Check a medicine now
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 bg-card/60 px-6 text-base backdrop-blur" asChild>
              <Link href="/apply">
                <Building2 />
                I&apos;m an organisation
              </Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground animate-rise" style={{ animationDelay: '320ms' }}>
            {['No app to install', 'No account needed', 'Always free for patients'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" strokeWidth={2.5} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise" style={{ animationDelay: '200ms' }}>
          <PhoneDemo />
        </div>
      </section>

      {/* Ticker */}
      <div className="relative border-y bg-card/50 py-4 backdrop-blur [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-medium whitespace-nowrap text-muted-foreground">
              <Blocks className="size-4 text-sky-600" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-foreground/10 ring-1 ring-foreground/10 lg:grid-cols-4">
          {[
            { n: <CountUp to={10} prefix="1 in " />, l: 'medical products in low- and middle-income countries is substandard or falsified (WHO)' },
            { n: <CountUp to={2} prefix="~" suffix="s" duration={900} />, l: 'from pointing your camera to a verdict' },
            { n: <CountUp to={5000} />, l: 'packs registered in a single blockchain transaction' },
            { n: <CountUp to={0} />, l: 'names or patient records ever written to the chain' },
          ].map(({ n, l }, i) => (
            <Reveal key={l} delay={i * 90} className="bg-card p-6 sm:p-8">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{n}</p>
              <p className="mt-2 text-sm text-muted-foreground">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <Reveal>
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Holograms get copied. Databases get edited. Recalls arrive too late.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Today&apos;s defences each fail in a specific way. DawaCheck was designed around those failures, not around the technology.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PROBLEMS.map(({ Icon, was, why, fix }, i) => (
            <Reveal key={was} delay={i * 90} className="group rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-600/15">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-semibold">{was}</h3>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{why}</p>
              <p className="mt-4 flex gap-2 border-t pt-4 text-sm font-medium">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                {fix}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-y bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              From the factory floor to the pharmacy counter, every step leaves a public record.
            </h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <span aria-hidden className="absolute top-[2.85rem] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-sky-500/0 via-sky-500/50 to-sky-500/0 lg:block" />
            {STEPS.map(({ Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 120} className="group relative rounded-2xl bg-background p-6 ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="absolute top-6 right-6 font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="relative grid size-11 place-items-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-8">
        <Reveal>
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">One record, trusted by people who don&apos;t trust each other.</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map(({ Icon, who, gets }, i) => (
            <Reveal key={who} delay={i * 90} className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground/80 ring-1 ring-foreground/5">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{who}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{gets}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Verdicts */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <Eyebrow>Five possible answers</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">A scan never says &ldquo;maybe&rdquo;.</h2>
            <p className="mt-4 text-muted-foreground">
              A copied QR still passes the blockchain check, so every scan is also weighed against that pack&apos;s own history:
              impossible travel, a spread across cities, scans outside the custody path.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/scan">
                Try it on a pack
                <ArrowRight />
              </Link>
            </Button>
          </Reveal>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {(Object.keys(VERDICT_UI) as Verdict[]).map((v, i) => {
              const { eyebrow, desc, Icon, tone } = VERDICT_UI[v]
              return (
                <Reveal as="li" key={v} delay={i * 80} className="flex gap-4 p-5 transition-colors hover:bg-muted/40">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full ring-1', tone.soft, tone.ring)}>
                    <Icon className={cn('size-5', tone.text)} />
                  </span>
                  <div>
                    <p className={cn('text-sm font-semibold', tone.text)}>{eyebrow}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </section>

      {/* On-chain vs off-chain */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <Reveal className="mb-10 max-w-2xl">
          <Eyebrow>Privacy by design</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Public where it matters. Private where it counts.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <DataColumn
              Icon={Blocks}
              title="On the blockchain"
              subtitle="Public and permanent. Even we can't change it."
              items={['Organisation licences', 'Batch fingerprints and expiry', 'Custody transfers', 'Recall flags']}
              tone="sky"
            />
          </Reveal>
          <Reveal delay={100}>
            <DataColumn
              Icon={Fingerprint}
              title="Off the blockchain"
              subtitle="In a private database. No patient data, ever."
              items={['Drug names and company details', 'Per-pack proofs', 'Scan events and rough location', 'Counterfeit alerts']}
              tone="slate"
            />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 pb-20 sm:px-8">
        <Reveal className="text-center">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">The hard ones, answered.</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map(({ q, a }, i) => (
            <Reveal key={q} delay={i * 70}>
              <details className="group rounded-2xl bg-card ring-1 ring-foreground/10 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center text-white sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.07)_1px,transparent_0)] bg-[length:22px_22px]"
          />
          <div aria-hidden className="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-sky-500/30 blur-3xl animate-drift" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Make every pack you handle provable.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-slate-300">
            Manufacturers, distributors and pharmacies apply once. After the regulator approves you, your licence is written
            on-chain and your dashboard unlocks.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 bg-white px-6 text-slate-950 hover:bg-white/90" asChild>
              <Link href="/apply">
                Apply for a licence
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-[2fr_1fr_1fr] sm:px-8">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-muted-foreground">Blockchain-based fake medicine detection. Built so that nobody, not even us, can quietly rewrite the record.</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Check</p>
            <Link href="/scan" className="block text-muted-foreground hover:text-foreground">Scan a pack</Link>
            <a href="#how" className="block text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</a>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Organisations</p>
            <Link href="/apply" className="block text-muted-foreground hover:text-foreground">Apply for a licence</Link>
            <Link href="/login" className="block text-muted-foreground hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">{children}</p>
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
    <div className="h-full rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
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
            <Check className={cn('size-4', tone === 'sky' ? 'text-sky-600' : 'text-slate-500')} strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
