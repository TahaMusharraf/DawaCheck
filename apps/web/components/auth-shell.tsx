import { BadgeCheck, FileText, KeyRound, LayoutDashboard, Search } from 'lucide-react'
import { AmbientBackground } from '@/components/backgrounds/ambient'
import { Brand } from '@/components/brand'
import { ChainVisual } from '@/components/landing/chain-visual'

const STATS = [
  { value: '1 tx', label: 'per batch of 5,000' },
  { value: '~2s', label: 'to verify a pack' },
  { value: '0', label: 'patient data on-chain' },
]

const LICENSING = [
  { Icon: FileText, title: 'You apply', text: 'Company details and licence number. Takes two minutes.' },
  { Icon: Search, title: 'The regulator reviews', text: 'DRAP checks your licence against its records.' },
  { Icon: BadgeCheck, title: 'Licence goes on-chain', text: 'A wallet is created and held for you. No crypto knowledge needed.' },
  { Icon: LayoutDashboard, title: 'Your dashboard unlocks', text: 'Register batches, receive stock, dispatch and sell.' },
]

/** Split screen for login/apply: a dark, animated story panel on desktop, just the form on phones. */
export function AuthShell({ panel, children }: { panel: 'login' | 'apply'; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:h-dvh lg:grid-cols-[1.05fr_1fr] lg:overflow-hidden">
      <section className="scrollbar-thin relative isolate hidden overflow-x-hidden overflow-y-auto p-10 text-ink-100 lg:flex lg:flex-col xl:p-14 short:p-8 short:xl:px-12 shorter:py-6">
        <AmbientBackground variant="dark" fixed className="right-auto w-[51.2%]" />

        <Brand dark className="relative" />

        <div className="relative my-auto w-full max-w-lg py-10 short:py-6 shorter:py-4">
          {panel === 'login' ? <LoginPanel /> : <ApplyPanel />}
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-mint/10 pt-6 short:pt-4 shorter:hidden">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="animate-rise" style={{ animationDelay: `${1100 + i * 120}ms` }}>
              <p className="font-display text-4xl leading-none text-white short:text-3xl">{value}</p>
              <p className="mt-1.5 text-xs text-brand-200/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="scrollbar-thin relative isolate flex flex-col px-4 py-8 sm:px-8 lg:overflow-y-auto short:py-5">
        <AmbientBackground />
        <Brand className="relative lg:hidden" />
        <div className="relative m-auto w-full max-w-sm py-10 animate-rise short:py-4">
          <div className="rounded-2xl bg-card/85 p-6 shadow-lift ring-1 ring-ink-900/[0.06] backdrop-blur-md sm:p-8 short:sm:p-7">{children}</div>
        </div>
      </section>
    </main>
  )
}

function LoginPanel() {
  return (
    <>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase animate-rise">Welcome back</p>
      <h2 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-white xl:text-5xl short:text-[2.4rem] short:xl:text-[2.6rem] shorter:text-[2.1rem] animate-rise" style={{ animationDelay: '80ms' }}>
        Every handover you make becomes part of a record <em className="text-mint">no one can rewrite.</em>
      </h2>
      <div className="mt-10 short:mt-6 shorter:mt-5">
        <ChainVisual />
      </div>
    </>
  )
}

function ApplyPanel() {
  return (
    <>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase animate-rise">Getting licensed</p>
      <h2 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-white xl:text-5xl short:text-[2.4rem] short:xl:text-[2.6rem] shorter:text-[2.1rem] animate-rise" style={{ animationDelay: '80ms' }}>
        Nobody can sign up and call themselves a manufacturer. <em className="text-mint">That&apos;s the point.</em>
      </h2>

      <ol className="relative mt-10 space-y-6 short:mt-6 short:space-y-4">
        <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px bg-white/15" />
        <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px overflow-hidden">
          <span className="absolute left-0 h-16 w-px bg-gradient-to-b from-transparent via-brand-300 to-transparent animate-travel" />
        </span>
        {LICENSING.map(({ Icon, title, text }, i) => (
          <li key={title} className="relative flex gap-4 animate-rise" style={{ animationDelay: `${200 + i * 160}ms` }}>
            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-brand-900/80 ring-1 ring-mint/15 backdrop-blur">
              <Icon className="size-[18px] text-brand-300" />
            </span>
            <div className="pt-0.5">
              <p className="font-medium text-white">{title}</p>
              <p className="mt-0.5 text-sm text-brand-200/70">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div
        className="mt-8 flex items-center gap-3 rounded-2xl bg-mint/[0.05] p-4 short:mt-5 short:p-3 text-sm text-brand-100/80 ring-1 ring-mint/10 backdrop-blur animate-rise"
        style={{ animationDelay: '900ms' }}
      >
        <KeyRound className="size-5 shrink-0 text-amber-300" />
        Until you&apos;re approved you can sign in, but you can&apos;t write anything to the chain.
      </div>
    </>
  )
}
