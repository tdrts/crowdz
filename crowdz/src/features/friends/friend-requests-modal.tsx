import { useEffect } from 'react'
import { useRespondFriendRequestMutation } from './hooks'
import type { FriendRequest } from './types'

interface FriendRequestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
  isLoading: boolean
}

export function FriendRequestsModal({
  open,
  onOpenChange,
  incomingRequests,
  outgoingRequests,
  isLoading,
}: FriendRequestsModalProps) {
  const respondMutation = useRespondFriendRequestMutation()

  useEffect(() => {
    if (!open) {
      respondMutation.reset()
    }
  }, [open, respondMutation])

  if (!open) return null

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    await respondMutation.mutateAsync({ requestId, action })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Friend requests</h2>
            <p className="text-sm text-muted-foreground">Manage invitations you’ve received or sent.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-card px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Incoming</h3>
            <div className="mt-2 space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : incomingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {request.fromUser.username}
                      </p>
                      <p className="text-xs text-muted-foreground">wants to add you</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespond(request.id, 'decline')}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespond(request.id, 'accept')}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Outgoing</h3>
            <div className="mt-2 space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : outgoingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven’t sent any new requests.</p>
              ) : (
                outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {request.toUser.username}
                      </p>
                      <p className="text-xs text-muted-foreground">Awaiting response…</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {respondMutation.error ? (
          <p className="mt-4 text-sm text-destructive">
            {(respondMutation.error as { message?: string })?.message ?? 'Action failed'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
