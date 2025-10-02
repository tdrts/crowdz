import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Meeting, MeetingParticipant, MeetingRequest } from './types'

function asRequestProfile(profile: any, fallbackId: string, fallbackLabel: string): {
  id: string
  username: string
} {
  if (profile?.id) {
    return {
      id: profile.id,
      username: profile.username ?? fallbackLabel,
    }
  }

  return {
    id: fallbackId,
    username: fallbackLabel,
  }
}

export async function fetchPendingMeetingRequest(userId: string): Promise<MeetingRequest | null> {
  const { data, error } = await supabase
    .from('meeting_requests')
    .select(
      `id, status, created_at, updated_at, from_user, to_user,
       from_profile:from_user(id, username),
       to_profile:to_user(id, username)`,
    )
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    const pgError = error as PostgrestError
    if (pgError.code === 'PGRST116') {
      return null
    }
    throw error
  }

  if (!data) return null

  return {
    id: data.id,
    fromUserId: data.from_user,
    toUserId: data.to_user,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at ?? null,
    fromUser: asRequestProfile(data.from_profile, data.from_user, 'Friend'),
    toUser: asRequestProfile(data.to_profile, data.to_user, 'Friend'),
  }
}

async function fetchMeetingParticipants(meetingId: string): Promise<MeetingParticipant[]> {
  const { data, error } = await supabase
    .from('meeting_participants')
    .select(`user_id, profiles:profiles(id, username)`)
    .eq('meeting_id', meetingId)

  if (error) throw error
  if (!data) return []

  return data.map((row: any) => ({
    userId: row.user_id,
    username: row.profiles?.username ?? 'Friend',
  }))
}

async function fetchMeetingById(meetingId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select(`id, started_by, color_hex, active, created_at, ended_at`)
    .eq('id', meetingId)
    .maybeSingle()

  if (error) {
    const pgError = error as PostgrestError
    if (pgError.code === 'PGRST116') {
      return null
    }
    throw error
  }

  if (!data) return null

  const participants = await fetchMeetingParticipants(meetingId)

  return {
    id: data.id,
    startedBy: data.started_by,
    colorHex: data.color_hex,
    active: data.active,
    createdAt: data.created_at,
    endedAt: data.ended_at ?? null,
    participants,
  }
}

export async function fetchActiveMeeting(userId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meeting_participants')
    .select(
      `meeting_id,
       meetings!inner(id, started_by, color_hex, active, created_at, ended_at)
      `,
    )
    .eq('user_id', userId)
    .eq('meetings.active', true)
    .order('created_at', { foreignTable: 'meetings', ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    const pgError = error as PostgrestError
    if (pgError.code === 'PGRST116') {
      return null
    }

    throw error
  }

  if (!data?.meetings) {
    return null
  }

  const meeting = data.meetings
  const participants = await fetchMeetingParticipants(meeting.id)

  return {
    id: meeting.id,
    startedBy: meeting.started_by,
    colorHex: meeting.color_hex,
    active: meeting.active,
    createdAt: meeting.created_at,
    endedAt: meeting.ended_at ?? null,
    participants,
  }
}

export async function startMeetingRequest(toUserId: string) {
  const { data, error } = await supabase.rpc('start_meeting_request', {
    target_user_id: toUserId,
  })

  if (error) throw error
  return data as { meeting_request_id: string }
}

export async function cancelMeetingRequest(meetingRequestId: string) {
  const { error } = await supabase.rpc('cancel_meeting_request', {
    request_id: meetingRequestId,
  })

  if (error) throw error
}

export async function respondToMeetingRequest({
  meetingRequestId,
  action,
}: {
  meetingRequestId: string
  action: 'accept' | 'decline'
}): Promise<{ meeting: Meeting | null }> {
  const { data, error } = await supabase.rpc('respond_meeting_request', {
    request_id: meetingRequestId,
    action,
  })

  if (error) throw error

  if (!data?.meeting_id) {
    return { meeting: null }
  }

  const meeting = data.meeting_id ? await fetchMeetingById(data.meeting_id) : null
  return { meeting }
}

export async function endMeeting(meetingId: string) {
  const { error } = await supabase.rpc('end_meeting', {
    p_meeting_id: meetingId,
  })

  if (error) throw error
}
