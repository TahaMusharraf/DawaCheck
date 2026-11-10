import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-ink-100)_25%,var(--color-brand-50)_50%,var(--color-ink-100)_75%)] bg-[length:200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
