import { humanize } from '@/lib/format'

/** "IMPOSSIBLE_TRAVEL,OUT_OF_CUSTODY" → one chip per rule. */
export function RuleChips({ rules }: { rules: string }) {
  return (
    <span className="flex flex-wrap gap-1">
      {rules
        .split(',')
        .filter(Boolean)
        .map((r) => (
          <span key={r} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap text-ink-700 ring-1 ring-ink-900/[0.04] ring-inset">
            {humanize(r)}
          </span>
        ))}
    </span>
  )
}
