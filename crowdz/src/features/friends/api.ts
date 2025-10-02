import { supabase } from '../../lib/supabase'
import type {
  Friend,
  FriendProfile,
  FriendRequest,
  RespondFriendRequestPayload,
  SendFriendRequestPayload,
} from './types'

function mapFriend(row: any): Friend {
  const friendProfile = row.friend_profile ?? {
    id: row.friend_id,
    username: 'Friend',
  }

  return {
    id: row.id,
    accepted: row.accepted,
    friendProfile: {
      id: friendProfile.id,
      username: friendProfile.username ?? 'Friend',
    },
    dailyMeets: row.daily_meets ?? 0,
    totalMeets: row.total_meets ?? 0,
  }
}

export async function fetchFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from('friends')
    .select(`id, user_id, friend_id, accepted, daily_meets, total_meets, friend_profile:friend_id(id, username)`)
    .eq('user_id', userId)
    .eq('accepted', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data) return []
  return data.map(mapFriend)
}

function buildDisplayName(
  profile: any,
  fallbackId: string,
  fallbackEmail?: string,
  defaultLabel?: string,
): FriendProfile {
  if (profile?.id) {
    return {
      id: profile.id,
      username: profile.username ?? fallbackEmail ?? defaultLabel ?? 'Unknown user',
    }
  }

  return {
    id: fallbackId,
    username: fallbackEmail ?? defaultLabel ?? 'Unknown user',
  }
}

function mapFriendRequest(row: any): FriendRequest {
  const fromProfile = buildDisplayName(row.from_profile, row.from_user, row.from_email, 'Unknown user')
  const toProfile = buildDisplayName(row.to_profile, row.to_user, row.to_email, 'Pending user')

  return {
    id: row.id,
    fromUserId: row.from_user,
    toUserId: row.to_user,
    status: row.status,
    created_at: row.created_at,
    fromUser: fromProfile,
    toUser: toProfile,
  }
}

export async function fetchIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `id, status, created_at, from_user, to_user, from_email, to_email,
       from_profile:from_user(id, username), to_profile:to_user(id, username)`,
    )
    .eq('to_user', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data) return []
  return data.map(mapFriendRequest)
}

export async function fetchOutgoingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `id, status, created_at, from_user, to_user, from_email, to_email,
       from_profile:from_user(id, username), to_profile:to_user(id, username)`,
    )
    .eq('from_user', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data) return []
  return data.map(mapFriendRequest)
}

export async function sendFriendRequest(payload: SendFriendRequestPayload) {
  const { error } = await supabase.rpc('send_friend_request', {
    target_email: payload.email,
  })

  if (error) throw error
}

export async function respondToFriendRequest({ requestId, action }: RespondFriendRequestPayload) {
  const { error } = await supabase.rpc('respond_friend_request', {
    request_id: requestId,
    action,
  })

  if (error) throw error
}

export async function removeFriend(friendId: string) {
  const { error } = await supabase.rpc('remove_friend', {
    target_friend_id: friendId,
  })

  if (error) throw error
}
