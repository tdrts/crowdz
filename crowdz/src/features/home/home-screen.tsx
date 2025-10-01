import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../providers/app-providers'
import { AddFriendModal } from '../friends/add-friend-modal'
import { FriendRequestsModal } from '../friends/friend-requests-modal'
import {
  useFriends,
  useIncomingFriendRequests,
  useOutgoingFriendRequests,
} from '../friends/hooks'
import type { Friend } from '../friends/types'
import { FriendList } from './friend-list'

interface HomeScreenProps {
  username: string
}

export function HomeScreen({ username }: HomeScreenProps) {
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [isRequestsOpen, setIsRequestsOpen] = useState(false)

  const { session } = useSession()
  const email = useMemo(() => session?.user.email ?? 'Unknown user', [session?.user.email])

  const { data: friends = [], isLoading: isFriendsLoading } = useFriends()
  const {
    data: incomingRequests = [],
    isLoading: isIncomingLoading,
    refetch: refetchIncoming,
  } = useIncomingFriendRequests()
  const {
    data: outgoingRequests = [],
    isLoading: isOutgoingLoading,
    refetch: refetchOutgoing,
  } = useOutgoingFriendRequests()

  useEffect(() => {
    if (isRequestsOpen) {
      refetchIncoming()
      refetchOutgoing()
    }
  }, [isRequestsOpen, refetchIncoming, refetchOutgoing])

  const pendingRequestsCount = incomingRequests.length

  const handleCallFriend = (friend: Friend) => {
    // Meeting flow will be wired up later. Placeholder for now.
    alert(`Meeting flow with ${friend.friendProfile.username} coming soon!`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Hey {username}</h1>
        <p className="text-sm text-muted-foreground">Signed in as {email}</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Friends</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRequestsOpen(true)}
              className="relative rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-card/80"
              disabled={isIncomingLoading && isOutgoingLoading}
            >
              Friend Requests
              {pendingRequestsCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                  {pendingRequestsCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setIsAddFriendOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground transition hover:opacity-90"
            >
              +
            </button>
          </div>
        </div>

        <FriendList friends={friends} isLoading={isFriendsLoading} onCallFriend={handleCallFriend} />
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-90"
      >
        Sign out
      </button>

      <AddFriendModal open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen} />
      <FriendRequestsModal
        open={isRequestsOpen}
        onOpenChange={setIsRequestsOpen}
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
        isLoading={isIncomingLoading || isOutgoingLoading}
      />
    </div>
  )
}
