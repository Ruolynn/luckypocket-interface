import { API_BASE_URL } from './constants'
import type {
  AuthNonceResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
  CreatePacketRequest,
  CreatePacketResponse,
  ClaimPacketRequest,
  ClaimPacketResponse,
  Packet,
  Claim,
  InviteStatsResponse,
  LeaderboardResponse,
  Achievement,
  Notification,
} from './types'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth APIs
  async getNonce(): Promise<AuthNonceResponse> {
    return this.request('/api/auth/siwe/nonce')
  }

  async verifySignature(data: AuthVerifyRequest): Promise<AuthVerifyResponse> {
    const result = await this.request<AuthVerifyResponse>('/api/auth/siwe/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.setToken(result.token)
    return result
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  // Packet APIs
  async createPacket(data: CreatePacketRequest): Promise<CreatePacketResponse> {
    return this.request('/api/packets/create', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async claimPacket(data: ClaimPacketRequest): Promise<ClaimPacketResponse> {
    return this.request('/api/packets/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPacket(packetId: string): Promise<Packet> {
    return this.request(`/api/packets/${packetId}`)
  }

  async getPacketClaims(packetId: string): Promise<Claim[]> {
    return this.request(`/api/packets/${packetId}/claims`)
  }

  async refundPacket(packetId: string): Promise<void> {
    return this.request(`/api/packets/${packetId}/refund`, {
      method: 'POST',
    })
  }

  async getMyPackets(): Promise<Packet[]> {
    return this.request('/api/packets/my')
  }

  // Invite APIs
  async acceptInvite(code: string): Promise<void> {
    return this.request('/api/invite/accept', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async getInviteStats(): Promise<InviteStatsResponse> {
    return this.request('/api/invite/stats')
  }

  // Leaderboard APIs
  async getLeaderboard(
    type: 'lucky' | 'generous' | 'active' | 'channel',
    timeRange?: '24h' | '7d' | '30d' | 'all'
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams()
    if (timeRange) params.set('range', timeRange)
    return this.request(`/api/leaderboard/${type}?${params}`)
  }

  // Achievement APIs
  async getAchievements(): Promise<Achievement[]> {
    return this.request('/api/achievements')
  }

  // Notification APIs
  async getNotifications(): Promise<Notification[]> {
    return this.request('/api/notifications')
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'POST',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
