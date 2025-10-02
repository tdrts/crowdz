export type MeetingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'

export interface MeetingParticipant {
  userId: string
  username: string
}

export interface MeetingRequestProfile {
  id: string
  username: string
}

export interface MeetingRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: MeetingRequestStatus
  createdAt: string
  updatedAt: string | null
  fromUser: MeetingRequestProfile
  toUser: MeetingRequestProfile
}

export interface Meeting {
  id: string
  startedBy: string
  colorHex: string
  active: boolean
  createdAt: string
  endedAt: string | null
  participants: MeetingParticipant[]
}
