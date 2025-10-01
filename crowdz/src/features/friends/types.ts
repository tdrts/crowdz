export interface FriendProfile {
  id: string
  username: string
}

export interface Friend {
  id: string
  accepted: boolean
  friendProfile: FriendProfile
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUser: FriendProfile
  toUser: FriendProfile
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface SendFriendRequestPayload {
  email: string
}

export interface RespondFriendRequestPayload {
  requestId: string
  action: 'accept' | 'decline'
}
