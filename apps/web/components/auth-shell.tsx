import { BadgeCheck, FileText, KeyRound, LayoutDashboard, Search } from 'lucide-react'
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
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-slate-100 lg:flex lg:flex-col xl:p-14">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.07)_1px,transparent_0)] bg-[length:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
        />
        <div aria-hidden className="absolute -bottom-48 -left-24 size-[38rem] rounded-full bg-sky-500/20 blur-3xl animate-drift" />
        <div aria-hidden className="absolute -top-40 -right-20 size-[28rem] rounded-full bg-emerald-400/10 blur-3xl animate-drift-slow" />

        <Brand className="relative text-white [&>span]:bg-white [&>span]:text-slate-950" />

        <div className="relative my-auto w-full max-w-lg py-10">
          {panel === 'login' ? <LoginPanel /> : <ApplyPanel />}
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="animate-rise" style={{ animationDelay: `${1100 + i * 120}ms` }}>
              <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative flex flex-col px-4 py-8 sm:px-8">
        <div aria-hidden className="absolute top-0 right-0 size-72 rounded-full bg-sky-200/30 blur-3xl lg:hidden" />
        <Brand className="relative lg:hidden" />
        <div className="relative m-auto w-full max-w-sm py-10 animate-rise">{children}</div>
      </section>
    </main>
  )
}

function LoginPanel() {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase animate-rise">Welcome back</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance xl:text-4xl animate-rise" style={{ animationDelay: '80ms' }}>
        Every handover you make becomes part of a record no one can rewrite.
      </h2>
      <div className="mt-10">
        <ChainVisual />
      </div>
    </>
  )
}

function ApplyPanel() {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase animate-rise">Getting licensed</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance xl:text-4xl animate-rise" style={{ animationDelay: '80ms' }}>
        Nobody can sign up and call themselves a manufacturer. That&apos;s the point.
      </h2>

      <ol className="relative mt-10 space-y-6">
        <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px bg-white/15" />
        <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px overflow-hidden">
          <span className="absolute left-0 h-16 w-px bg-gradient-to-b from-transparent via-sky-300 to-transparent animate-travel" />
        </span>
        {LICENSING.map(({ Icon, title, text }, i) => (
          <li key={title} className="relative flex gap-4 animate-rise" style={{ animationDelay: `${200 + i * 160}ms` }}>
            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 ring-1 ring-white/15">
              <Icon className="size-[18px] text-sky-300" />
            </span>
            <div className="pt-0.5">
              <p className="font-medium text-white">{title}</p>
              <p className="mt-0.5 text-sm text-slate-400">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div
        className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-300 ring-1 ring-white/10 animate-rise"
        style={{ animationDelay: '900ms' }}
      >
        <KeyRound className="size-5 shrink-0 text-amber-300" />
        Until you&apos;re approved you can sign in, but you can&apos;t write anything to the chain.
      </div>
    </>
  )
}
