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
import {
  useActiveMeeting,
  useCancelMeetingRequestMutation,
  useConfirmMeetingMutation,
  useEndMeetingMutation,
  usePendingMeetingRequest,
  useRespondMeetingRequestMutation,
  useStartMeetingMutation,
} from '../meetings/hooks'
import { WaitingMeetingScreen } from '../meetings/waiting-meeting-screen'
import { IncomingMeetingModal } from '../meetings/incoming-meeting-modal'
import { SignalScreen } from '../meetings/signal-screen'

interface HomeScreenProps {
  username: string
}

export function HomeScreen({ username }: HomeScreenProps) {
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [isRequestsOpen, setIsRequestsOpen] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)
  const [hadPendingRequest, setHadPendingRequest] = useState(false)
  const [hadActiveMeeting, setHadActiveMeeting] = useState(false)

  const { session } = useSession()
  const userId = session?.user.id
  const email = useMemo(() => session?.user.email ?? 'Unknown user', [session?.user.email])

  const {
    data: friends = [],
    isLoading: isFriendsLoading,
    refetch: refetchFriends,
  } = useFriends()
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

  const {
    data: pendingMeetingRequest,
    isLoading: isMeetingRequestLoading,
    refetch: refetchPendingMeeting,
  } = usePendingMeetingRequest()
  const {
    data: activeMeeting,
    isLoading: isActiveMeetingLoading,
    refetch: refetchActiveMeeting,
  } = useActiveMeeting()

  const startMeetingMutation = useStartMeetingMutation()
  const cancelMeetingMutation = useCancelMeetingRequestMutation()
  const respondMeetingMutation = useRespondMeetingRequestMutation()
  const confirmMeetingMutation = useConfirmMeetingMutation()
  const endMeetingMutation = useEndMeetingMutation()

  useEffect(() => {
    if (isRequestsOpen) {
      refetchIncoming()
      refetchOutgoing()
    }
  }, [isRequestsOpen, refetchIncoming, refetchOutgoing])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`meeting-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_requests', filter: `from_user=eq.${userId}` },
        () => {
          refetchPendingMeeting()
          refetchActiveMeeting()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_requests', filter: `to_user=eq.${userId}` },
        () => {
          refetchPendingMeeting()
          refetchActiveMeeting()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants', filter: `user_id=eq.${userId}` },
        () => {
          refetchActiveMeeting()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refetchPendingMeeting, refetchActiveMeeting])

  useEffect(() => {
    if (pendingMeetingRequest && !activeMeeting) {
      setHadPendingRequest(true)
      return
    }

    if (!pendingMeetingRequest && hadPendingRequest) {
      refetchActiveMeeting()
      setHadPendingRequest(false)
    }
  }, [pendingMeetingRequest, hadPendingRequest, refetchActiveMeeting, activeMeeting])

  useEffect(() => {
    if (activeMeeting) {
      setHadActiveMeeting(true)
      return
    }

    if (!activeMeeting && hadActiveMeeting) {
      refetchFriends()
      refetchPendingMeeting()
      setHadActiveMeeting(false)
    }
  }, [activeMeeting, hadActiveMeeting, refetchFriends, refetchPendingMeeting])

  const pendingRequestsCount = incomingRequests.length

  const handleCallFriend = async (friend: Friend) => {
    setStartError(null)
    if (!friend.friendProfile.id) {
      setStartError('Unable to start a meeting for this friend.')
      return
    }

    try {
      await startMeetingMutation.mutateAsync(friend.friendProfile.id)
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Failed to start meeting.'
      setStartError(message)
    }
  }

  const handleCancelMeetingRequest = async () => {
    if (!pendingMeetingRequest) return
    setCancelError(null)
    try {
      await cancelMeetingMutation.mutateAsync(pendingMeetingRequest.id)
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Failed to cancel request.'
      setCancelError(message)
    }
  }

  const handleRespondMeetingRequest = async (action: 'accept' | 'decline') => {
    if (!pendingMeetingRequest) return
    setRespondError(null)
    try {
      await respondMeetingMutation.mutateAsync({
        meetingRequestId: pendingMeetingRequest.id,
        action,
      })
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Something went wrong. Try again.'
      setRespondError(message)
    }
  }

  const handleEndMeeting = async () => {
    if (!activeMeeting) return
    try {
      await endMeetingMutation.mutateAsync(activeMeeting.id)
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Failed to end meeting.'
      // Surface end error inside SignalScreen via throw
      throw new Error(message)
    }
  }

  const handleConfirmMeeting = async () => {
    if (!activeMeeting) return
    try {
      await confirmMeetingMutation.mutateAsync(activeMeeting.id)
    } catch (error) {
      const message = (error as { message?: string }).message ?? 'Failed to confirm meeting.'
      throw new Error(message)
    }
  }

  const isCaller = pendingMeetingRequest?.fromUserId === userId
  const isRecipient = pendingMeetingRequest?.toUserId === userId
  const pendingFriendName = isCaller
    ? pendingMeetingRequest?.toUser.username
    : pendingMeetingRequest?.fromUser.username

  const actionsDisabled =
    !!pendingMeetingRequest ||
    startMeetingMutation.isPending ||
    isMeetingRequestLoading ||
    respondMeetingMutation.isPending ||
    confirmMeetingMutation.isPending ||
    !!activeMeeting ||
    isActiveMeetingLoading

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

        <FriendList
          friends={friends}
          isLoading={isFriendsLoading}
          onCallFriend={handleCallFriend}
          disableActions={actionsDisabled}
          isActionLoading={startMeetingMutation.isPending}
        />
        {startError ? <p className="text-sm text-destructive">{startError}</p> : null}
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

      <WaitingMeetingScreen
        open={Boolean(pendingMeetingRequest && isCaller && !activeMeeting)}
        friendName={pendingFriendName}
        onCancel={handleCancelMeetingRequest}
        isCancelling={cancelMeetingMutation.isPending}
        error={cancelError}
      />
      <IncomingMeetingModal
        open={Boolean(pendingMeetingRequest && isRecipient && !activeMeeting)}
        friendName={pendingFriendName}
        onAccept={() => handleRespondMeetingRequest('accept')}
        onDecline={() => handleRespondMeetingRequest('decline')}
        isResponding={respondMeetingMutation.isPending}
        error={respondError}
      />
      {activeMeeting && userId ? (
        <SignalScreen
          open
          meeting={activeMeeting}
          currentUserId={userId}
          onConfirmMeeting={handleConfirmMeeting}
          isConfirming={confirmMeetingMutation.isPending}
          onEndMeeting={handleEndMeeting}
          isEnding={endMeetingMutation.isPending}
        />
      ) : null}
    </div>
  )
}
