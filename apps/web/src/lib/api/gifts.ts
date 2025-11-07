/**
 * @file Gifts API
 * @description Gift-related API endpoints with retry logic and error handling
 */

import type { Gift, GiftType, CreateGiftRequest } from '../gift-types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

// Custom error types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
}

class GiftsAPI {
  private baseURL: string
  private retryConfig: typeof DEFAULT_RETRY_CONFIG

  constructor(baseURL: string, retryConfig = DEFAULT_RETRY_CONFIG) {
    this.baseURL = baseURL
    this.retryConfig = retryConfig
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    retries = this.retryConfig.maxRetries
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    // Add JWT token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt') || localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Request failed',
          error: 'UNKNOWN_ERROR'
        }))

        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.error || errorData.code,
          errorData.details
        )
      }

      return response.json()
    } catch (error) {
      // Network error or fetch failed
      if (error instanceof TypeError) {
        if (retries > 0) {
          const delay = Math.min(
            this.retryConfig.initialDelay *
              Math.pow(this.retryConfig.backoffMultiplier,
                this.retryConfig.maxRetries - retries),
            this.retryConfig.maxDelay
          )

          console.log(`Network error, retrying in ${delay}ms... (${retries} retries left)`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.request<T>(endpoint, options, retries - 1)
        }
        throw new NetworkError('Network request failed. Please check your connection.')
      }

      // API error - don't retry on client errors (4xx)
      if (error instanceof APIError && error.statusCode && error.statusCode < 500) {
        throw error
      }

      // Server error (5xx) - retry
      if (error instanceof APIError && retries > 0) {
        const delay = Math.min(
          this.retryConfig.initialDelay *
            Math.pow(this.retryConfig.backoffMultiplier,
              this.retryConfig.maxRetries - retries),
          this.retryConfig.maxDelay
        )

        console.log(`Server error, retrying in ${delay}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, options, retries - 1)
      }

      throw error
    }
  }

  /**
   * Get gift by ID
   */
  async getGift(giftId: string): Promise<Gift> {
    return this.request<Gift>(`/api/v1/gifts/${giftId}`)
  }

  /**
   * Get gifts list with filters
   */
  async getGifts(params?: {
    status?: string
    limit?: number
    offset?: number
    orderBy?: 'createdAt' | 'expiresAt'
    order?: 'asc' | 'desc'
  }): Promise<{
    gifts: Gift[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }

    return this.request(`/api/v1/gifts?${searchParams.toString()}`)
  }

  /**
   * Get user sent gifts (uses general gifts endpoint with senderId filter)
   */
  async getUserSentGifts(
    userId: string,
    params?: {
      status?: 'PENDING' | 'CLAIMED' | 'REFUNDED' | 'EXPIRED'
      limit?: number
      offset?: number
      orderBy?: 'createdAt' | 'expiresAt'
      order?: 'asc' | 'desc'
    }
  ): Promise<{
    gifts: Gift[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }> {
    const searchParams = new URLSearchParams()
    searchParams.set('senderId', userId)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value))
        }
      })
    }

    return this.request(`/api/v1/gifts?${searchParams.toString()}`)
  }

  /**
   * Get user received gifts (uses general gifts endpoint with recipientAddress filter)
   */
  async getUserReceivedGifts(
    recipientAddress: string,
    params?: {
      status?: 'PENDING' | 'CLAIMED' | 'REFUNDED' | 'EXPIRED'
      limit?: number
      offset?: number
      orderBy?: 'createdAt' | 'expiresAt'
      order?: 'asc' | 'desc'
    }
  ): Promise<{
    gifts: Gift[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }> {
    const searchParams = new URLSearchParams()
    searchParams.set('recipientAddress', recipientAddress)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value))
        }
      })
    }

    return this.request(`/api/v1/gifts?${searchParams.toString()}`)
  }

  /**
   * Create a new gift
   */
  async createGift(data: {
    giftType: GiftType
    token: string
    amount: string
    recipient: string
    message: string
    theme?: string
    expireTime: string
  }): Promise<{
    success: boolean
    giftId: string
    gift: Gift
  }> {
    // Convert to backend API format
    const requestData = {
      recipientAddress: data.recipient,
      tokenType: data.giftType === 'TOKEN' ? 'ERC20' : data.giftType,
      tokenAddress: data.token,
      amount: data.amount,
      daysUntilExpiry: Math.ceil(
        (new Date(data.expireTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      message: data.message,
    }

    return this.request('/api/v1/gifts/create', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  }

  /**
   * Prepare gift creation data (get unsigned transaction)
   */
  async prepareCreateGift(data: CreateGiftRequest): Promise<{
    to: string
    data: string
    value: string
    gasEstimate: string
  }> {
    return this.request('/api/v1/gifts/prepare', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Check if user can claim a gift
   */
  async canClaim(giftId: string): Promise<{ canClaim: boolean; reason?: string }> {
    return this.request(`/api/v1/gifts/${giftId}/can-claim`)
  }

  /**
   * Record gift claim
   */
  async recordClaim(
    giftId: string,
    data: {
      txHash: string
      gasUsed?: string
      gasPrice?: string
    }
  ): Promise<{
    success: boolean
    data: {
      giftId: string
      status: string
      claimedAt: string
      claimTxHash: string
    }
  }> {
    return this.request(`/api/v1/gifts/${giftId}/claim`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Refund an expired gift
   */
  async refundGift(giftId: string): Promise<{
    success: boolean
    txHash: string
  }> {
    return this.request(`/api/v1/gifts/${giftId}/refund`, {
      method: 'POST',
    })
  }

  /**
   * Proxy claim gift (gas-less claim with signature or ERC-4337)
   */
  async proxyClaimGift(
    giftId: string,
    data?: {
      signature?: string
      message?: string
      usePaymaster?: boolean
    }
  ): Promise<{
    success: boolean
    txHash?: string
    message?: string
    nonce?: string
    instructions?: string
  }> {
    return this.request(`/api/v1/gifts/${giftId}/claim-proxy`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  /**
   * Validate ERC20 token
   */
  async validateToken(tokenAddress: string): Promise<{
    isValid: boolean
    isERC20: boolean
    isBlacklisted: boolean
    metadata: {
      symbol?: string
      decimals?: number
      name?: string
    }
    risks: string[]
    warnings: string[]
  }> {
    return this.request('/api/v1/tokens/validate', {
      method: 'POST',
      body: JSON.stringify({ tokenAddress }),
    })
  }

  /**
   * Get global statistics
   */
  async getStats(): Promise<{
    data: {
      totalGifts: number
      totalClaimed: number
      totalRefunded: number
      totalPending: number
      totalExpired: number
      totalValueETH: string
      totalUsers: number
      stats24h: {
        giftsCreated: number
        giftsClaimed: number
      }
    }
  }> {
    return this.request('/api/v1/stats')
  }
}

export const giftsAPI = new GiftsAPI(API_BASE_URL)
