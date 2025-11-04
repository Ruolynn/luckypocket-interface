/**
 * @file API Client
 * @description HTTP client for DeGift API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class APIClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Fix: Use Record<string, string> for headers type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    // Add JWT token if available
    // Fix: Check for browser environment to avoid SSR errors
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  auth = {
    getNonce: async (address: string) => {
      return this.request<{ nonce: string }>(`/api/v1/auth/nonce?address=${address}`)
    },

    verify: async (data: { message: string; signature: string }) => {
      return this.request<{ token: string; user: { id: string; address: string } }>(
        '/api/v1/auth/verify',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
    },

    me: async () => {
      return this.request<{ id: string; address: string }>('/api/v1/auth/me')
    },
  }
}

export const api = new APIClient(API_BASE_URL)
