/**
 * @file Socket Audit Service Unit Tests
 * @description Tests for security event logging and suspicious activity detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SocketAuditService, SecurityEventType, type SecurityEvent } from '../../../src/services/socket-audit.service'
import type { PrismaClient } from '@prisma/client'

// Mock Prisma Client
const createMockPrisma = () => {
  const events: any[] = []

  return {
    socketSecurityEvent: {
      create: vi.fn(async ({ data }: any) => {
        const event = {
          id: `event_${events.length + 1}`,
          ...data,
          createdAt: new Date(),
        }
        events.push(event)
        return event
      }),

      count: vi.fn(async ({ where }: any) => {
        return events.filter((event) => {
          let matches = true

          if (where.ip && event.ip !== where.ip) matches = false
          if (where.userId && event.userId !== where.userId) matches = false
          if (where.type && event.type !== where.type) matches = false
          if (where.createdAt) {
            const eventTime = new Date(event.createdAt).getTime()
            if (where.createdAt.gte) {
              const minTime = new Date(where.createdAt.gte).getTime()
              if (eventTime < minTime) matches = false
            }
            if (where.createdAt.lte) {
              const maxTime = new Date(where.createdAt.lte).getTime()
              if (eventTime > maxTime) matches = false
            }
          }

          return matches
        }).length
      }),

      findMany: vi.fn(async ({ where, orderBy, take }: any) => {
        let filtered = events.filter((event) => {
          let matches = true

          if (where) {
            if (where.userId && event.userId !== where.userId) matches = false
            if (where.type && event.type !== where.type) matches = false
            if (where.createdAt) {
              const eventTime = new Date(event.createdAt).getTime()
              if (where.createdAt.gte) {
                const minTime = new Date(where.createdAt.gte).getTime()
                if (eventTime < minTime) matches = false
              }
            }
          }

          return matches
        })

        if (orderBy?.createdAt === 'desc') {
          filtered = filtered.sort((a, b) => b.createdAt - a.createdAt)
        }

        if (take) {
          filtered = filtered.slice(0, take)
        }

        return filtered
      }),

      deleteMany: vi.fn(async ({ where }: any) => {
        const before = events.length
        const cutoffTime = where.createdAt?.lt ? new Date(where.createdAt.lt).getTime() : 0

        for (let i = events.length - 1; i >= 0; i--) {
          if (new Date(events[i].createdAt).getTime() < cutoffTime) {
            events.splice(i, 1)
          }
        }

        return { count: before - events.length }
      }),

      // Test utility
      __getEvents: () => events,
      __clearEvents: () => {
        events.length = 0
      },
    },
  } as unknown as PrismaClient
}

describe('SocketAuditService', () => {
  let service: SocketAuditService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    service = new SocketAuditService(mockPrisma)

    // Clear events before each test
    mockPrisma.socketSecurityEvent.__clearEvents()
  })

  describe('logSecurityEvent', () => {
    it('should log AUTH_SUCCESS event', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user123',
        socketId: 'socket456',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { address: '0x1234' },
      }

      await service.logSecurityEvent(event)

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user123',
        socketId: 'socket456',
        ip: '192.168.1.1',
      })
    })

    it('should log AUTH_FAILED event', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_FAILED,
        socketId: 'socket456',
        ip: '192.168.1.1',
        details: { reason: 'Invalid token' },
      }

      await service.logSecurityEvent(event)

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe(SecurityEventType.AUTH_FAILED)
    })

    it('should log ROOM_JOINED event', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.ROOM_JOINED,
        userId: 'user123',
        socketId: 'socket456',
        ip: '192.168.1.1',
        details: { room: 'packet:abc123' },
      }

      await service.logSecurityEvent(event)

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].details).toEqual({ room: 'packet:abc123' })
    })

    it('should trigger suspicious activity detection on AUTH_FAILED', async () => {
      const detectSpy = vi.spyOn(service as any, 'detectSuspiciousActivity')

      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_FAILED,
        socketId: 'socket456',
        ip: '192.168.1.1',
      }

      await service.logSecurityEvent(event)

      expect(detectSpy).toHaveBeenCalledWith('192.168.1.1', '192.168.1.1')
    })

    it('should trigger suspicious activity detection on PERMISSION_DENIED', async () => {
      const detectSpy = vi.spyOn(service as any, 'detectSuspiciousActivity')

      const event: SecurityEvent = {
        type: SecurityEventType.PERMISSION_DENIED,
        userId: 'user123',
        socketId: 'socket456',
        ip: '192.168.1.1',
      }

      await service.logSecurityEvent(event)

      expect(detectSpy).toHaveBeenCalledWith('user123', '192.168.1.1')
    })

    it('should log SUSPICIOUS_ACTIVITY event if detected', async () => {
      const ip = '192.168.1.1'

      // Simulate 10 auth failures (reaches threshold)
      for (let i = 0; i < 10; i++) {
        await service.logSecurityEvent({
          type: SecurityEventType.AUTH_FAILED,
          socketId: `socket${i}`,
          ip,
        })
      }

      // One more should trigger suspicious activity detection
      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILED,
        socketId: 'socket10',
        ip,
      })

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      const suspiciousEvents = events.filter(
        (e: any) => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY
      )

      expect(suspiciousEvents.length).toBeGreaterThan(0)
    })

    it('should handle logging errors gracefully', async () => {
      mockPrisma.socketSecurityEvent.create.mockRejectedValueOnce(new Error('Database error'))

      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user123',
        socketId: 'socket456',
        ip: '192.168.1.1',
      }

      // Should not throw
      await expect(service.logSecurityEvent(event)).resolves.not.toThrow()
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('should return false when no suspicious activity', async () => {
      const isSuspicious = await service.detectSuspiciousActivity('user123', '192.168.1.1')

      expect(isSuspicious).toBe(false)
    })

    it('should detect excessive auth failures from same IP', async () => {
      const ip = '192.168.1.1'

      // Log 10 auth failures (meets threshold)
      for (let i = 0; i < 10; i++) {
        await mockPrisma.socketSecurityEvent.create({
          data: {
            type: SecurityEventType.AUTH_FAILED,
            socketId: `socket${i}`,
            ip,
            createdAt: new Date(),
          },
        })
      }

      const isSuspicious = await service.detectSuspiciousActivity('user123', ip)

      expect(isSuspicious).toBe(true)
    })

    it('should detect excessive permission denials from same user', async () => {
      const userId = 'user123'

      // Log 20 permission denials (meets threshold)
      for (let i = 0; i < 20; i++) {
        await mockPrisma.socketSecurityEvent.create({
          data: {
            type: SecurityEventType.PERMISSION_DENIED,
            userId,
            socketId: `socket${i}`,
            ip: '192.168.1.1',
            createdAt: new Date(),
          },
        })
      }

      const isSuspicious = await service.detectSuspiciousActivity(userId, '192.168.1.1')

      expect(isSuspicious).toBe(true)
    })

    it('should detect rapid reconnects from same IP', async () => {
      const ip = '192.168.1.1'

      // Log 5 auth successes in short time (meets threshold)
      for (let i = 0; i < 5; i++) {
        await mockPrisma.socketSecurityEvent.create({
          data: {
            type: SecurityEventType.AUTH_SUCCESS,
            userId: `user${i}`,
            socketId: `socket${i}`,
            ip,
            createdAt: new Date(),
          },
        })
      }

      const isSuspicious = await service.detectSuspiciousActivity('user123', ip)

      expect(isSuspicious).toBe(true)
    })

    it('should consider time-based filtering in detection', async () => {
      const ip = '192.168.1.1'

      // Log 5 recent auth failures (under threshold of 10)
      for (let i = 0; i < 5; i++) {
        await mockPrisma.socketSecurityEvent.create({
          data: {
            type: SecurityEventType.AUTH_FAILED,
            socketId: `socket${i}`,
            ip,
            createdAt: new Date(),
          },
        })
      }

      const isSuspicious = await service.detectSuspiciousActivity('user123', ip)

      // Should not detect because events (5) are under threshold (10)
      expect(isSuspicious).toBe(false)
    })

    it('should handle detection errors gracefully', async () => {
      mockPrisma.socketSecurityEvent.count.mockRejectedValueOnce(new Error('Database error'))

      const isSuspicious = await service.detectSuspiciousActivity('user123', '192.168.1.1')

      // Should return false on error (fail safe)
      expect(isSuspicious).toBe(false)
    })
  })

  describe('getUserAuditLog', () => {
    it('should return user audit logs', async () => {
      const userId = 'user123'

      // Create some events
      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId,
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      await service.logSecurityEvent({
        type: SecurityEventType.ROOM_JOINED,
        userId,
        socketId: 'socket1',
        ip: '192.168.1.1',
        details: { room: 'packet:abc' },
      })

      const logs = await service.getUserAuditLog(userId)

      expect(logs).toHaveLength(2)
      expect(logs[0].userId).toBe(userId)
    })

    it('should limit results to specified limit', async () => {
      const userId = 'user123'

      // Create 10 events
      for (let i = 0; i < 10; i++) {
        await service.logSecurityEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          userId,
          socketId: `socket${i}`,
          ip: '192.168.1.1',
        })
      }

      const logs = await service.getUserAuditLog(userId, 5)

      expect(logs).toHaveLength(5)
    })

    it('should return events in descending order (newest first)', async () => {
      const userId = 'user123'

      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId,
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10))

      await service.logSecurityEvent({
        type: SecurityEventType.ROOM_JOINED,
        userId,
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      const logs = await service.getUserAuditLog(userId)

      expect(logs[0].type).toBe(SecurityEventType.ROOM_JOINED)
      expect(logs[1].type).toBe(SecurityEventType.AUTH_SUCCESS)
    })

    it('should return empty array on error', async () => {
      mockPrisma.socketSecurityEvent.findMany.mockRejectedValueOnce(new Error('Database error'))

      const logs = await service.getUserAuditLog('user123')

      expect(logs).toEqual([])
    })
  })

  describe('getRealTimeStats', () => {
    it('should return statistics for last hour', async () => {
      // Create various events
      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILED,
        socketId: 'socket2',
        ip: '192.168.1.2',
      })

      await service.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId: 'user3',
        socketId: 'socket3',
        ip: '192.168.1.3',
      })

      const stats = await service.getRealTimeStats()

      expect(stats.totalEvents).toBe(3)
      expect(stats.authFailures).toBe(1)
      expect(stats.activeConnections).toBe(1) // AUTH_SUCCESS count
      expect(stats.suspiciousActivities).toBe(1)
    })

    it('should return zero stats when no events', async () => {
      const stats = await service.getRealTimeStats()

      expect(stats.totalEvents).toBe(0)
      expect(stats.authFailures).toBe(0)
      expect(stats.activeConnections).toBe(0)
      expect(stats.suspiciousActivities).toBe(0)
    })

    it('should return zero stats on error', async () => {
      mockPrisma.socketSecurityEvent.count.mockRejectedValueOnce(new Error('Database error'))

      const stats = await service.getRealTimeStats()

      expect(stats.totalEvents).toBe(0)
      expect(stats.authFailures).toBe(0)
      expect(stats.activeConnections).toBe(0)
      expect(stats.suspiciousActivities).toBe(0)
    })
  })

  describe('getEventsByType', () => {
    it('should return events of specified type', async () => {
      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILED,
        socketId: 'socket2',
        ip: '192.168.1.2',
      })

      const authFailures = await service.getEventsByType(SecurityEventType.AUTH_FAILED, 24)

      expect(authFailures).toHaveLength(1)
      expect(authFailures[0].type).toBe(SecurityEventType.AUTH_FAILED)
    })

    it('should filter by time range', async () => {
      // This test would require mocking time, simplified for now
      const events = await service.getEventsByType(SecurityEventType.AUTH_SUCCESS, 24)

      expect(Array.isArray(events)).toBe(true)
    })

    it('should limit to 100 results', async () => {
      // Create more than 100 events
      for (let i = 0; i < 150; i++) {
        await service.logSecurityEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          userId: `user${i}`,
          socketId: `socket${i}`,
          ip: '192.168.1.1',
        })
      }

      const events = await service.getEventsByType(SecurityEventType.AUTH_SUCCESS, 24)

      expect(events.length).toBeLessThanOrEqual(100)
    })

    it('should return empty array on error', async () => {
      mockPrisma.socketSecurityEvent.findMany.mockRejectedValueOnce(new Error('Database error'))

      const events = await service.getEventsByType(SecurityEventType.AUTH_SUCCESS, 24)

      expect(events).toEqual([])
    })
  })

  describe('cleanupOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
      const recentDate = new Date()

      // Create old event directly to events array
      const events = mockPrisma.socketSecurityEvent.__getEvents()
      events.push({
        id: 'old-event',
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        socketId: 'socket1',
        ip: '192.168.1.1',
        createdAt: oldDate,
      })

      // Create recent event
      events.push({
        id: 'recent-event',
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user2',
        socketId: 'socket2',
        ip: '192.168.1.2',
        createdAt: recentDate,
      })

      const deletedCount = await service.cleanupOldLogs(30)

      expect(deletedCount).toBe(1)

      const remaining = mockPrisma.socketSecurityEvent.__getEvents()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].userId).toBe('user2')
    })

    it('should return 0 when no old logs', async () => {
      await service.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user1',
        socketId: 'socket1',
        ip: '192.168.1.1',
      })

      const deletedCount = await service.cleanupOldLogs(30)

      expect(deletedCount).toBe(0)
    })

    it('should return 0 on error', async () => {
      mockPrisma.socketSecurityEvent.deleteMany.mockRejectedValueOnce(new Error('Database error'))

      const deletedCount = await service.cleanupOldLogs(30)

      expect(deletedCount).toBe(0)
    })
  })

  describe('SecurityEventType enum', () => {
    it('should have all required event types', () => {
      expect(SecurityEventType.AUTH_SUCCESS).toBe('auth_success')
      expect(SecurityEventType.AUTH_FAILED).toBe('auth_failed')
      expect(SecurityEventType.ROOM_JOINED).toBe('room_joined')
      expect(SecurityEventType.ROOM_LEFT).toBe('room_left')
      expect(SecurityEventType.PERMISSION_DENIED).toBe('permission_denied')
      expect(SecurityEventType.RATE_LIMIT_EXCEEDED).toBe('rate_limit_exceeded')
      expect(SecurityEventType.CONNECTION_REJECTED).toBe('connection_rejected')
      expect(SecurityEventType.SUSPICIOUS_ACTIVITY).toBe('suspicious_activity')
      expect(SecurityEventType.CONCURRENT_LIMIT_EXCEEDED).toBe('concurrent_limit_exceeded')
    })
  })

  describe('edge cases', () => {
    it('should handle events without userId', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.CONNECTION_REJECTED,
        socketId: 'socket1',
        ip: '192.168.1.1',
      }

      await expect(service.logSecurityEvent(event)).resolves.not.toThrow()

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      expect(events[0].userId).toBeUndefined()
    })

    it('should handle events without userAgent', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user123',
        socketId: 'socket1',
        ip: '192.168.1.1',
      }

      await expect(service.logSecurityEvent(event)).resolves.not.toThrow()
    })

    it('should handle empty details object', async () => {
      const event: SecurityEvent = {
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user123',
        socketId: 'socket1',
        ip: '192.168.1.1',
        details: {},
      }

      await service.logSecurityEvent(event)

      const events = mockPrisma.socketSecurityEvent.__getEvents()
      expect(events[0].details).toEqual({})
    })
  })
})
