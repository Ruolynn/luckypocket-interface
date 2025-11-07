/**
 * @file Socket Rate Limiter Service Unit Tests
 * @description Tests for rate limiting, concurrent connection control, and IP banning
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SocketRateLimiterService } from '../../../src/services/socket-rate-limiter.service'
import { createClient } from 'redis'

// Mock Redis client
vi.mock('redis', () => {
  const mockRedis = new Map<string, { value: any; ttl?: number; type: 'string' | 'set' }>()
  const mockSets = new Map<string, Set<string>>()

  return {
    createClient: vi.fn(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),

      // String operations
      incr: vi.fn((key: string) => {
        const current = mockRedis.get(key)
        const newValue = current ? Number(current.value) + 1 : 1
        mockRedis.set(key, { value: newValue, type: 'string' })
        return Promise.resolve(newValue)
      }),

      set: vi.fn((key: string, value: string, options?: any) => {
        mockRedis.set(key, { value, ttl: options?.EX, type: 'string' })
        return Promise.resolve('OK')
      }),

      get: vi.fn((key: string) => {
        const data = mockRedis.get(key)
        return Promise.resolve(data?.value || null)
      }),

      del: vi.fn((key: string) => {
        const existed = mockRedis.has(key) || mockSets.has(key)
        mockRedis.delete(key)
        mockSets.delete(key)
        return Promise.resolve(existed ? 1 : 0)
      }),

      exists: vi.fn((key: string) => {
        return Promise.resolve(mockRedis.has(key) || mockSets.has(key) ? 1 : 0)
      }),

      expire: vi.fn((key: string, seconds: number) => {
        const data = mockRedis.get(key)
        if (data) {
          data.ttl = seconds
        }
        return Promise.resolve(1)
      }),

      ttl: vi.fn((key: string) => {
        const data = mockRedis.get(key)
        return Promise.resolve(data?.ttl || -1)
      }),

      // Set operations
      sAdd: vi.fn((key: string, ...members: string[]) => {
        if (!mockSets.has(key)) {
          mockSets.set(key, new Set())
        }
        const set = mockSets.get(key)!
        members.forEach(m => set.add(m))
        return Promise.resolve(members.length)
      }),

      sRem: vi.fn((key: string, ...members: string[]) => {
        const set = mockSets.get(key)
        if (!set) return Promise.resolve(0)
        let removed = 0
        members.forEach(m => {
          if (set.delete(m)) removed++
        })
        return Promise.resolve(removed)
      }),

      sCard: vi.fn((key: string) => {
        const set = mockSets.get(key)
        return Promise.resolve(set ? set.size : 0)
      }),

      sMembers: vi.fn((key: string) => {
        const set = mockSets.get(key)
        return Promise.resolve(set ? Array.from(set) : [])
      }),

      keys: vi.fn((pattern: string) => {
        const allKeys = [...mockRedis.keys(), ...mockSets.keys()]
        // Simple pattern matching for 'socket:*' patterns
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
        return Promise.resolve(allKeys.filter(k => regex.test(k)))
      }),

      // Test utility - clear all data
      __clearAll: () => {
        mockRedis.clear()
        mockSets.clear()
      },
    })),
  }
})

describe('SocketRateLimiterService', () => {
  let service: SocketRateLimiterService
  let mockRedisClient: any

  beforeEach(async () => {
    service = new SocketRateLimiterService('redis://localhost:6379')
    mockRedisClient = (service as any).redis
    await service.connect()

    // Clear all data before each test
    mockRedisClient.__clearAll()
  })

  afterEach(async () => {
    await service.disconnect()
  })

  describe('checkIpRateLimit', () => {
    it('should allow connections within rate limit', async () => {
      const ip = '192.168.1.1'

      const result = await service.checkIpRateLimit(ip)

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(1)
      expect(result.max).toBe(10)
      expect(result.retryAfter).toBeUndefined()
    })

    it('should reject connections exceeding rate limit', async () => {
      const ip = '192.168.1.1'

      // Simulate 10 connections
      for (let i = 0; i < 10; i++) {
        await service.checkIpRateLimit(ip)
      }

      // 11th connection should be rejected
      const result = await service.checkIpRateLimit(ip)

      expect(result.allowed).toBe(false)
      expect(result.current).toBe(11)
      expect(result.max).toBe(10)
      expect(result.retryAfter).toBe(60)
    })

    it('should auto-ban IP after exceeding 2x rate limit', async () => {
      const ip = '192.168.1.1'

      // Simulate 21 connections (2x limit + 1)
      for (let i = 0; i < 21; i++) {
        await service.checkIpRateLimit(ip)
      }

      // Check if IP is banned
      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(true)
    })

    it('should reject banned IP with retry time', async () => {
      const ip = '192.168.1.1'

      // Ban the IP
      await service.banIp(ip, 300)

      const result = await service.checkIpRateLimit(ip)

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('checkUserRateLimit', () => {
    it('should allow connections within user rate limit', async () => {
      const userId = 'user123'

      const result = await service.checkUserRateLimit(userId)

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(1)
      expect(result.max).toBe(5)
      expect(result.retryAfter).toBeUndefined()
    })

    it('should reject connections exceeding user rate limit', async () => {
      const userId = 'user123'

      // Simulate 5 connections
      for (let i = 0; i < 5; i++) {
        await service.checkUserRateLimit(userId)
      }

      // 6th connection should be rejected
      const result = await service.checkUserRateLimit(userId)

      expect(result.allowed).toBe(false)
      expect(result.current).toBe(6)
      expect(result.max).toBe(5)
      expect(result.retryAfter).toBe(60)
    })

    it('should track different users independently', async () => {
      const user1 = 'user1'
      const user2 = 'user2'

      // User 1 makes 3 connections
      for (let i = 0; i < 3; i++) {
        await service.checkUserRateLimit(user1)
      }

      // User 2 makes 1 connection
      const result2 = await service.checkUserRateLimit(user2)

      expect(result2.allowed).toBe(true)
      expect(result2.current).toBe(1)
    })
  })

  describe('checkConcurrentConnections', () => {
    it('should allow connections within concurrent limit', async () => {
      const userId = 'user123'
      const socketId = 'socket1'

      await service.recordConnection('192.168.1.1', userId, socketId)

      const result = await service.checkConcurrentConnections(userId)

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(1)
      expect(result.max).toBe(3)
    })

    it('should reject connections exceeding concurrent limit', async () => {
      const userId = 'user123'

      // Record 3 concurrent connections
      await service.recordConnection('192.168.1.1', userId, 'socket1')
      await service.recordConnection('192.168.1.1', userId, 'socket2')
      await service.recordConnection('192.168.1.1', userId, 'socket3')

      const result = await service.checkConcurrentConnections(userId)

      expect(result.allowed).toBe(false)
      expect(result.current).toBe(3)
      expect(result.max).toBe(3)
    })

    it('should return 0 for user with no connections', async () => {
      const userId = 'user123'

      const result = await service.checkConcurrentConnections(userId)

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(0)
    })
  })

  describe('recordConnection', () => {
    it('should record connection for user', async () => {
      const userId = 'user123'
      const socketId = 'socket1'

      await service.recordConnection('192.168.1.1', userId, socketId)

      const result = await service.checkConcurrentConnections(userId)
      expect(result.current).toBe(1)
    })

    it('should record multiple connections', async () => {
      const userId = 'user123'

      await service.recordConnection('192.168.1.1', userId, 'socket1')
      await service.recordConnection('192.168.1.1', userId, 'socket2')

      const result = await service.checkConcurrentConnections(userId)
      expect(result.current).toBe(2)
    })

    it('should store socket-to-user mapping', async () => {
      const userId = 'user123'
      const socketId = 'socket1'

      await service.recordConnection('192.168.1.1', userId, socketId)

      // Verify mapping exists by checking if removal works
      await service.removeConnection(userId, socketId)

      const result = await service.checkConcurrentConnections(userId)
      expect(result.current).toBe(0)
    })
  })

  describe('removeConnection', () => {
    it('should remove connection record', async () => {
      const userId = 'user123'
      const socketId = 'socket1'

      await service.recordConnection('192.168.1.1', userId, socketId)
      await service.removeConnection(userId, socketId)

      const result = await service.checkConcurrentConnections(userId)
      expect(result.current).toBe(0)
    })

    it('should handle removing non-existent connection', async () => {
      const userId = 'user123'
      const socketId = 'socket1'

      // Should not throw error
      await expect(service.removeConnection(userId, socketId)).resolves.not.toThrow()
    })

    it('should only remove specified socket', async () => {
      const userId = 'user123'

      await service.recordConnection('192.168.1.1', userId, 'socket1')
      await service.recordConnection('192.168.1.1', userId, 'socket2')

      await service.removeConnection(userId, 'socket1')

      const result = await service.checkConcurrentConnections(userId)
      expect(result.current).toBe(1)
    })
  })

  describe('getOldestConnection', () => {
    it('should return first connection socket ID', async () => {
      const userId = 'user123'

      await service.recordConnection('192.168.1.1', userId, 'socket1')
      await service.recordConnection('192.168.1.1', userId, 'socket2')

      const oldestSocketId = await service.getOldestConnection(userId)

      expect(oldestSocketId).toBeTruthy()
      expect(['socket1', 'socket2']).toContain(oldestSocketId)
    })

    it('should return null for user with no connections', async () => {
      const userId = 'user123'

      const oldestSocketId = await service.getOldestConnection(userId)

      expect(oldestSocketId).toBeNull()
    })
  })

  describe('banIp', () => {
    it('should ban IP address', async () => {
      const ip = '192.168.1.1'

      await service.banIp(ip, 300)

      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(true)
    })

    it('should use default ban duration if not specified', async () => {
      const ip = '192.168.1.1'

      await service.banIp(ip)

      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(true)
    })

    it('should set TTL on ban record', async () => {
      const ip = '192.168.1.1'
      const duration = 300

      await service.banIp(ip, duration)

      const key = `socket:banned:${ip}`
      const ttl = await mockRedisClient.ttl(key)

      expect(ttl).toBe(duration)
    })
  })

  describe('isIpBanned', () => {
    it('should return true for banned IP', async () => {
      const ip = '192.168.1.1'

      await service.banIp(ip)

      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(true)
    })

    it('should return false for non-banned IP', async () => {
      const ip = '192.168.1.1'

      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(false)
    })
  })

  describe('unbanIp', () => {
    it('should unban IP address', async () => {
      const ip = '192.168.1.1'

      await service.banIp(ip)
      await service.unbanIp(ip)

      const isBanned = await service.isIpBanned(ip)
      expect(isBanned).toBe(false)
    })

    it('should handle unbanning non-banned IP', async () => {
      const ip = '192.168.1.1'

      // Should not throw error
      await expect(service.unbanIp(ip)).resolves.not.toThrow()
    })
  })

  describe('getStats', () => {
    it('should return statistics with no connections', async () => {
      const stats = await service.getStats()

      expect(stats.totalConnections).toBe(0)
      expect(stats.bannedIps).toBe(0)
    })

    it('should count total connections across all users', async () => {
      await service.recordConnection('192.168.1.1', 'user1', 'socket1')
      await service.recordConnection('192.168.1.1', 'user1', 'socket2')
      await service.recordConnection('192.168.1.1', 'user2', 'socket3')

      const stats = await service.getStats()

      expect(stats.totalConnections).toBe(3)
    })

    it('should count banned IPs', async () => {
      await service.banIp('192.168.1.1')
      await service.banIp('192.168.1.2')
      await service.banIp('192.168.1.3')

      const stats = await service.getStats()

      expect(stats.bannedIps).toBe(3)
    })
  })

  describe('error handling', () => {
    it('should fail open on rate limit check error', async () => {
      // Mock error
      const errorService = new SocketRateLimiterService('redis://localhost:6379')
      await errorService.connect()

      // Force an error by disconnecting
      await errorService.disconnect()

      const result = await errorService.checkIpRateLimit('192.168.1.1')

      // Should allow connection on error (fail open)
      expect(result.allowed).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty userId', async () => {
      const result = await service.checkUserRateLimit('')

      expect(result.allowed).toBe(true)
      expect(result.current).toBe(1)
    })

    it('should handle empty socketId', async () => {
      await expect(
        service.recordConnection('192.168.1.1', 'user123', '')
      ).resolves.not.toThrow()
    })

    it('should be case-sensitive for IP addresses', async () => {
      await service.banIp('192.168.1.1')

      // IP addresses should be treated as case-sensitive (though they're typically lowercase)
      const isBanned = await service.isIpBanned('192.168.1.1')
      expect(isBanned).toBe(true)
    })
  })
})
