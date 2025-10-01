import type { Friend } from '../friends/types'

interface FriendListProps {
  friends: Friend[]
  isLoading?: boolean
  onCallFriend: (friend: Friend) => void
}

export function FriendList({ friends, isLoading, onCallFriend }: FriendListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading friends…
      </div>
    )
  }

  if (!friends.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        No friends yet. Tap the plus button to add someone by email.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div>
            <p className="text-base font-medium text-foreground">{friend.friendProfile.username}</p>
            <p className="text-xs text-muted-foreground">Ready to meet up</p>
          </div>
          <button
            type="button"
            onClick={() => onCallFriend(friend)}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Start Meet
          </button>
        </div>
      ))}
    </div>
  )
}
