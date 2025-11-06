// API Types
export interface User {
  id: string
  address: string
  farcasterFid?: string
  inviteCode?: string
  createdAt: string
}

export interface Packet {
  id: string
  packetId: string
  txHash?: string
  creator: User
  creatorId: string
  token: string
  tokenSymbol?: string
  tokenDecimals?: number
  totalAmount: string
  count: number
  isRandom: boolean
  message: string
  remainingAmount: string
  remainingCount: number
  expireTime: string
  refunded: boolean
  createdAt: string
  vrfRequestId?: string
  vrfReady?: boolean
}

export interface Claim {
  id: string
  packetId: string
  user: User
  userId: string
  amount: string
  txHash?: string
  isBest: boolean
  claimedAt: string
}

export interface Invitation {
  id: string
  inviter: User
  inviterId: string
  invitee: User
  inviteeId: string
  rewardPaid: boolean
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  user: User
  value: string
  count?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  progress?: number
  unlocked: boolean
  unlockedAt?: string
}

export interface Notification {
  id: string
  type: 'packet_claimed' | 'packet_created' | 'invite_accepted' | 'achievement_unlocked'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

// API Request/Response Types
export interface CreatePacketRequest {
  token: string
  totalAmount: string
  count: number
  isRandom: boolean
  message: string
  expireTime: string
}

export interface CreatePacketResponse {
  packet: Packet
}

export interface ClaimPacketRequest {
  packetId: string
}

export interface ClaimPacketResponse {
  claim: Claim
  packet: Packet
}

export interface AuthNonceResponse {
  nonce: string
}

export interface AuthVerifyRequest {
  message: string
  signature: string
}

export interface AuthVerifyResponse {
  token: string
  user: User
}

export interface InviteStatsResponse {
  totalInvites: number
  activeInvites: number
  totalRewards: string
  pendingRewards: string
  invitations: Invitation[]
}

export interface LeaderboardEntry {
  rank: number
  address: string
  farcasterName?: string | null
  farcasterFid?: number | null
  score: string
  userId: string
}

export interface LeaderboardResponse {
  type: 'luck' | 'generous' | 'active' | 'channel'
  range: string
  top: LeaderboardEntry[]
}
