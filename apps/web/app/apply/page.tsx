'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Factory, LoaderCircle, Store, Truck } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'
import { FormField } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/password-input'
import { Input } from '@/components/ui/input'
import { send } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { OrgType } from '@/lib/types'

const TYPES: { value: OrgType; label: string; Icon: typeof Factory }[] = [
  { value: 'MANUFACTURER', label: 'Manufacturer', Icon: Factory },
  { value: 'DISTRIBUTOR', label: 'Distributor', Icon: Truck },
  { value: 'PHARMACY', label: 'Pharmacy', Icon: Store },
]

export default function ApplyPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [orgType, setOrgType] = useState<OrgType>('MANUFACTURER')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const res = await send<{ accessToken: string }>('POST', '/auth/register', {
        orgName: form.get('orgName'),
        orgType,
        licenseNo: form.get('licenseNo'),
        city: form.get('city'),
        email: form.get('email'),
        password: form.get('password'),
      })
      // Signs straight in: the dashboard shows "under review" until the regulator approves.
      await signIn(res.accessToken)
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell panel="apply">
      <h1 className="text-2xl font-semibold tracking-tight">Apply for a licence</h1>
      <p className="mt-1 text-sm text-muted-foreground">The regulator reviews every application before it can act on the chain.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Organisation type</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={orgType === value}
                onClick={() => setOrgType(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium ring-1 transition-all',
                  orgType === value
                    ? 'bg-foreground text-background ring-foreground shadow-sm'
                    : 'bg-card text-muted-foreground ring-foreground/10 hover:text-foreground hover:ring-foreground/25',
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <FormField label="Organisation name" htmlFor="orgName">
          <Input id="orgName" name="orgName" required placeholder="Getz Pharma" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Licence no." htmlFor="licenseNo">
            <Input id="licenseNo" name="licenseNo" required placeholder="DRAP-12345" />
          </FormField>
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" required placeholder="Karachi" />
          </FormField>
        </div>
        <FormField label="Admin email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Password" htmlFor="password" hint="8 to 32 characters.">
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} maxLength={32} required />
        </FormField>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20">{error}</p>}

        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" />}
          Submit application
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already licensed?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
