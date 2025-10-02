interface IncomingMeetingModalProps {
  open: boolean
  friendName?: string
  onAccept: () => void
  onDecline: () => void
  isResponding?: boolean
  error?: string | null
}

export function IncomingMeetingModal({
  open,
  friendName,
  onAccept,
  onDecline,
  isResponding = false,
  error,
}: IncomingMeetingModalProps) {
  if (!open) return null

  const displayName = friendName ?? 'A friend'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-foreground">{displayName} wants to meet</h2>
          <p className="text-sm text-muted-foreground">
            Accept to jump to the signal screen together, or decline if the timing is off.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isResponding}
          >
            {isResponding ? 'Working…' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isResponding}
          >
            {isResponding ? 'Working…' : 'Accept'}
          </button>
        </div>

        {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
