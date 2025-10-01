import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSendFriendRequestMutation } from './hooks'

const addFriendSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type AddFriendValues = z.infer<typeof addFriendSchema>

interface AddFriendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFriendModal({ open, onOpenChange }: AddFriendModalProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFriendValues>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: { email: '' },
  })

  const sendRequest = useSendFriendRequestMutation()

  useEffect(() => {
    if (!open) {
      reset({ email: '' })
      setStatusMessage(null)
      sendRequest.reset()
    }
  }, [open, reset, sendRequest])

  if (!open) return null

  const onSubmit = async (values: AddFriendValues) => {
    setStatusMessage(null)
    try {
      await sendRequest.mutateAsync({ email: values.email })
      setStatusMessage('Invite sent! They will see it in their Friend Requests list.')
      reset({ email: '' })
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Something went wrong. Please try again later.'
      setStatusMessage(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add a friend</h2>
            <p className="text-sm text-muted-foreground">
              We will email them an invite and show a pending request in their app.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-card px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="friend-email">
              Friend email
            </label>
            <input
              id="friend-email"
              type="email"
              autoComplete="email"
              placeholder="friend@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={sendRequest.isPending}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendRequest.isPending ? 'Sending…' : 'Send invite'}
          </button>
        </form>

        {statusMessage ? (
          <p className="mt-4 text-sm text-emerald-600">{statusMessage}</p>
        ) : null}
        {sendRequest.error && !statusMessage ? (
          <p className="mt-4 text-sm text-destructive">
            {(sendRequest.error as { message?: string })?.message ?? 'Failed to send invite'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
