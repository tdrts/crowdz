import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../providers/app-providers'
import {
  fetchFriends,
  fetchIncomingFriendRequests,
  fetchOutgoingFriendRequests,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from './api'
import type { RespondFriendRequestPayload, SendFriendRequestPayload } from './types'

export function useFriends() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['friends', userId],
    queryFn: () => fetchFriends(userId as string),
    enabled: Boolean(userId),
  })
}

export function useIncomingFriendRequests() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['friend-requests', 'incoming', userId],
    queryFn: () => fetchIncomingFriendRequests(userId as string),
    enabled: Boolean(userId),
  })
}

export function useOutgoingFriendRequests() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['friend-requests', 'outgoing', userId],
    queryFn: () => fetchOutgoingFriendRequests(userId as string),
    enabled: Boolean(userId),
  })
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (payload: SendFriendRequestPayload) => sendFriendRequest(payload),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'outgoing', userId] })
    },
  })
}

export function useRespondFriendRequestMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (payload: RespondFriendRequestPayload) => respondToFriendRequest(payload),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'incoming', userId] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'outgoing', userId] })
      queryClient.invalidateQueries({ queryKey: ['friends', userId] })
    },
  })
}

export function useRemoveFriendMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['friends', userId] })
    },
  })
}
