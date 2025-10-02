import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../providers/app-providers'
import {
  cancelMeetingRequest,
  confirmMeeting,
  endMeeting,
  fetchActiveMeeting,
  fetchPendingMeetingRequest,
  respondToMeetingRequest,
  startMeetingRequest,
} from './api'
import type { Meeting } from './types'

export function usePendingMeetingRequest() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['meeting-request', userId],
    queryFn: () => fetchPendingMeetingRequest(userId as string),
    enabled: Boolean(userId),
    staleTime: 5_000,
    refetchInterval: userId ? 1_000 : false,
    refetchOnWindowFocus: true,
  })
}

export function useActiveMeeting() {
  const { session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['meeting', 'active', userId],
    queryFn: () => fetchActiveMeeting(userId as string),
    enabled: Boolean(userId),
    staleTime: 5_000,
    refetchInterval: userId ? 1_000 : false,
    refetchOnWindowFocus: true,
  })
}

export function useStartMeetingMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (toUserId: string) => startMeetingRequest(toUserId),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['meeting-request', userId] })
      queryClient.invalidateQueries({ queryKey: ['meeting', 'active', userId] })
    },
  })
}

export function useCancelMeetingRequestMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (meetingRequestId: string) => cancelMeetingRequest(meetingRequestId),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['meeting-request', userId] })
      queryClient.invalidateQueries({ queryKey: ['meeting', 'active', userId] })
    },
  })
}

export function useRespondMeetingRequestMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (variables: { meetingRequestId: string; action: 'accept' | 'decline' }) =>
      respondToMeetingRequest(variables),
    onSuccess: (data) => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: ['meeting-request', userId] })
      queryClient.invalidateQueries({ queryKey: ['meeting', 'active', userId] })
      if (data.meeting) {
        queryClient.setQueryData(['meeting', 'active', userId], data.meeting as Meeting)
      }
    },
  })
}

export function useConfirmMeetingMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (meetingId: string) => confirmMeeting(meetingId),
    onSuccess: () => {
      if (!userId) return
      queryClient.setQueryData(['meeting', 'active', userId], null)
      queryClient.invalidateQueries({ queryKey: ['meeting', 'active', userId] })
      queryClient.invalidateQueries({ queryKey: ['meeting-request', userId] })
      queryClient.invalidateQueries({ queryKey: ['friends', userId] })
    },
  })
}

export function useEndMeetingMutation() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id

  return useMutation({
    mutationFn: (meetingId: string) => endMeeting(meetingId),
    onSuccess: () => {
      if (!userId) return
      queryClient.setQueryData(['meeting', 'active', userId], null)
      queryClient.invalidateQueries({ queryKey: ['meeting', 'active', userId] })
      queryClient.invalidateQueries({ queryKey: ['meeting-request', userId] })
    },
  })
}
