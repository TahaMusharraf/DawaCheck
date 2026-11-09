'use client'

import { useState } from 'react'
import { KeyRound, LoaderCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { ORG_LABEL } from '@/components/dashboard/nav'
import { FormField, PageHeader, Panel } from '@/components/dashboard/ui'
import { OrgStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/password-input'
import { Input } from '@/components/ui/input'
import { send } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function AccountPage() {
  const { me } = useAuth()
  if (!me) return null

  return (
    <>
      <PageHeader title="Account" description="Your sign-in details. Every change asks for your current password." />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <EmailForm current={me.email} />
          <PasswordForm />
        </div>

        <Panel title="Organisation" delay={120}>
          <dl className="space-y-3 px-5 py-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{me.org.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{ORG_LABEL[me.org.type]}</dd>
            </div>
            {me.org.type !== 'REGULATOR' && (
              <div>
                <dt className="text-muted-foreground">Licence</dt>
                <dd className="mt-0.5">
                  <OrgStatusBadge status={me.org.status} />
                </dd>
              </div>
            )}
          </dl>
          {me.org.type !== 'REGULATOR' && (
            <p className="border-t px-5 py-3 text-xs text-muted-foreground">
              Organisation details come from your licence. Contact the regulator to change them.
            </p>
          )}
        </Panel>
      </div>
    </>
  )
}

function EmailForm({ current }: { current: string }) {
  const { refresh } = useAuth()
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const email = String(form.get('email')).trim()
    if (email.toLowerCase() === current.toLowerCase()) {
      toast.info('That is already your email')
      return
    }
    setBusy(true)
    try {
      await send('PATCH', '/users/update', { email, password: form.get('password') })
      await refresh()
      formEl.reset()
      toast.success('Email updated', { description: `Sign in with ${email} from now on.` })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Email" description={`You sign in as ${current}.`}>
      <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="New email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </FormField>
          <FormField label="Current password" htmlFor="email-password">
            <PasswordInput id="email-password" name="password" autoComplete="current-password" required />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Mail />}
            Update email
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function PasswordForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const newPassword = String(form.get('newPassword'))
    if (newPassword !== form.get('confirm')) {
      setError('The new passwords do not match.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await send('PATCH', '/users/update', { password: form.get('password'), newPassword })
      formEl.reset()
      toast.success('Password changed')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Password" description="8 to 32 characters." delay={60}>
      <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
        <FormField label="Current password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="New password" htmlFor="newPassword">
            <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" minLength={8} maxLength={32} required />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirm">
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} maxLength={32} required />
          </FormField>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
            Change password
          </Button>
        </div>
      </form>
    </Panel>
  )
}
