import { useMemo } from 'react'

interface WaitingMeetingScreenProps {
  open: boolean
  friendName?: string
  onCancel: () => void
  isCancelling?: boolean
  error?: string | null
}

export function WaitingMeetingScreen({
  open,
  friendName,
  onCancel,
  isCancelling = false,
  error,
}: WaitingMeetingScreenProps) {
  const displayName = useMemo(() => friendName ?? 'your friend', [friendName])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">Waiting for {displayName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We’ve sent a notification. Keep an eye out while they respond.
        </p>

        <button
          type="button"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCancel}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling…' : 'Cancel meet request'}
        </button>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
