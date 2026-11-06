import { Blocks, Fingerprint, ShieldCheck } from 'lucide-react'
import { Brand } from '@/components/brand'

const POINTS = [
  { Icon: ShieldCheck, text: 'Only regulator-approved organisations can register medicine.' },
  { Icon: Blocks, text: 'Every batch and handover is written to a public blockchain.' },
  { Icon: Fingerprint, text: 'Copied labels are caught from their scan history.' },
]

/** Split screen for login/apply: a dark story panel on desktop, just the form on phones. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-slate-100 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.08)_1px,transparent_0)] bg-[length:22px_22px]"
        />
        <div aria-hidden className="absolute -bottom-40 -left-20 size-[36rem] rounded-full bg-sky-500/20 blur-3xl animate-drift" />
        <div aria-hidden className="absolute -top-32 right-0 size-96 rounded-full bg-emerald-400/10 blur-3xl animate-drift-slow" />

        <Brand className="relative text-white [&>span]:bg-white [&>span]:text-slate-950" />

        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            A medicine supply chain nobody can quietly rewrite.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ Icon, text }, i) => (
              <li key={text} className="flex gap-3 text-sm text-slate-300 animate-rise" style={{ animationDelay: `${200 + i * 120}ms` }}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <Icon className="size-4 text-sky-300" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col px-4 py-8 sm:px-8">
        <Brand className="lg:hidden" />
        <div className="m-auto w-full max-w-sm py-10 animate-rise">{children}</div>
      </section>
    </main>
  )
}
