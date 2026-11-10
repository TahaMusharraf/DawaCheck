import { Check, Factory, ShieldCheck, Store, Truck } from 'lucide-react'

const NODES = [
  { Icon: Factory, role: 'Manufacturer', name: 'Getz Pharma', city: 'Karachi', tx: '0x8f3a…c1e2' },
  { Icon: Truck, role: 'Distributor', name: 'Lahore Medical Supply', city: 'Lahore', tx: '0x2b7d…94af' },
  { Icon: Store, role: 'Pharmacy', name: 'Al-Shifa Pharmacy', city: 'Rawalpindi', tx: '0xd41c…7b30' },
]

/** One batch moving down the chain: a pulse travels the rail and each stop shows its on-chain receipt. */
export function ChainVisual() {
  return (
    <div className="relative">
      <div className="relative space-y-4 short:space-y-2.5">
        {/* Rail with a travelling pulse. */}
        <span aria-hidden className="absolute top-7 bottom-7 left-7 w-px bg-white/15" />
        <span aria-hidden className="absolute top-7 bottom-7 left-7 w-px overflow-hidden">
          <span className="absolute left-0 h-16 w-px bg-gradient-to-b from-transparent via-brand-300 to-transparent animate-travel" />
        </span>

        {NODES.map(({ Icon, role, name, city, tx }, i) => (
          <div
            key={role}
            className="relative flex items-center gap-4 rounded-2xl bg-mint/[0.04] p-3 pr-4 shorter:py-2 ring-1 ring-mint/10 backdrop-blur-md transition-colors hover:bg-mint/[0.07] animate-rise"
            style={{ animationDelay: `${150 + i * 180}ms` }}
          >
            <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-brand-900/80 ring-1 ring-mint/15">
              <Icon className="size-5 text-brand-300" />
              <span
                className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-brand-500 ring-2 ring-brand-950 animate-pop"
                style={{ animationDelay: `${700 + i * 400}ms` }}
              >
                <Check className="size-2.5 text-white" strokeWidth={3.5} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium tracking-wider text-brand-200/60 uppercase">{role}</p>
              <p className="truncate text-sm font-medium text-white">{name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-200/60">{city}</p>
              <p className="font-mono text-[11px] text-brand-300/80">{tx}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The patient's scan at the end of the chain. */}
      <div
        className="relative mt-5 ml-auto flex w-fit short:mt-3 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink-900 shadow-2xl shadow-brand-950/40 animate-rise"
        style={{ animationDelay: '900ms' }}
      >
        <span className="relative grid size-9 place-items-center">
          <span className="absolute inset-0 rounded-full bg-brand-500 animate-pulse-ring" />
          <span className="relative grid size-9 place-items-center rounded-full bg-brand-50 ring-1 ring-brand-600/20">
            <ShieldCheck className="size-5 text-brand-700" />
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold">Genuine medicine</p>
          <p className="text-xs text-ink-500">Patient scan · Panadol 500 mg</p>
        </div>
      </div>
    </div>
  )
}
