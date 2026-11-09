'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'
import { FormField } from '@/components/dashboard/ui'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/password-input'
import { Input } from '@/components/ui/input'
import { send } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { me, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (me) router.replace('/dashboard')
  }, [me, router])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const res = await send<{ accessToken: string }>('POST', '/auth/login', {
        email: form.get('email'),
        password: form.get('password'),
      })
      await signIn(res.accessToken)
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell panel="login">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">For regulators, manufacturers, distributors and pharmacies.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.pk" />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </FormField>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20">{error}</p>}

        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New organisation?{' '}
        <Link href="/apply" className="font-medium text-foreground underline-offset-4 hover:underline">
          Apply for a licence
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Just checking a pack?{' '}
        <Link href="/scan" className="font-medium text-foreground underline-offset-4 hover:underline">
          Scan it, no account needed
        </Link>
      </p>
    </AuthShell>
  )
}
