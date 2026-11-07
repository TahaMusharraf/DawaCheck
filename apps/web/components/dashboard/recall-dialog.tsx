'use client'

import { useState } from 'react'
import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { send } from '@/lib/api'

export function RecallDialog({ batchId, label, onDone }: { batchId: string; label: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await send('POST', '/recalls', { batchId, reason: reason.trim() })
      toast.success('Batch recalled on-chain', { description: 'Every scan of this batch now shows RECALLED.' })
      setOpen(false)
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <ShieldAlert />
          Recall batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recall {label}?</DialogTitle>
          <DialogDescription>
            This writes a recall to the blockchain. It can&apos;t be undone, and every scan of this batch will show RECALLED
            straight away.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason, e.g. contamination found in quality testing"
          maxLength={500}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !reason.trim()}>
            {busy && <LoaderCircle className="animate-spin" />}
            Confirm recall
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
