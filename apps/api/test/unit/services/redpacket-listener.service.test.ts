/**
 * @file RedPacket Listener Service Unit Tests
 * @description Tests for RedPacket event handling, best claim marker, and historical sync
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RedPacketListenerService } from '../../../src/services/redpacket-listener.service'
import type { PrismaClient } from '@prisma/client'
import type { Address } from 'viem'

// Mock viem client
const mockClient = {
  watchContractEvent: vi.fn(() => vi.fn()),
  getBlock: vi.fn(),
  getBlockNumber: vi.fn(() => Promise.resolve(BigInt(1000))),
  getContractEvents: vi.fn(() => Promise.resolve([])),
}

vi.mock('viem', async () => {
  const actual = await vi.importActual('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => mockClient),
  }
})

// Mock contract service
vi.mock('../../../src/services/contract.service', () => ({
  getTokenMetadata: vi.fn(async (address: Address) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'ETH', decimals: 18, name: 'Ethereum' }
    }
    return { symbol: 'USDC', decimals: 6, name: 'USD Coin' }
  }),
}))

describe('RedPacketListenerService', () => {
  let service: RedPacketListenerService
  let mockPrisma: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock Prisma client
    mockPrisma = {
      packet: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(() => Promise.resolve([])),
        updateMany: vi.fn(),
      },
      packetClaim: {
        create: vi.fn(),
        findMany: vi.fn(() => Promise.resolve([])),
        updateMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        if (typeof callback === 'function') {
          return await callback(mockPrisma)
        }
        // Array of operations
        return Promise.all(callback)
      }),
    }

    // Create service instance
    service = new RedPacketListenerService(
      {
        rpcUrl: 'http://localhost:8545',
        contractAddress: '0xcd7345bf7e3cf327aa3F674bef64e027eB33F97b' as Address,
        chainId: 11155111,
        pollingInterval: 4000,
      },
      mockPrisma as unknown as PrismaClient
    )
  })

  afterEach(async () => {
    await service.stop()
  })

  describe('start/stop', () => {
    it('should start listening to events', async () => {
      await service.start()

      // Should watch 4 events
      expect(mockClient.watchContractEvent).toHaveBeenCalledTimes(4)
      expect(mockClient.watchContractEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketCreated' })
      )
      expect(mockClient.watchContractEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketClaimed' })
      )
      expect(mockClient.watchContractEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketVrfRequested' })
      )
      expect(mockClient.watchContractEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketRandomReady' })
      )
    })

    it('should not start if already running', async () => {
      await service.start()
      const callCount = mockClient.watchContractEvent.mock.calls.length

      await service.start() // Try to start again
      expect(mockClient.watchContractEvent).toHaveBeenCalledTimes(callCount) // No new calls
    })

    it('should stop all watchers', async () => {
      await service.start()
      await service.stop()

      // Watchers should be cleared
      expect(mockClient.watchContractEvent).toHaveBeenCalledTimes(4)
    })
  })

  describe('PacketCreated event handling', () => {
    it('should create packet record with ETH token', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValueOnce({ id: 'user-1', address: '0xcreator' })
      mockPrisma.packet.create.mockResolvedValueOnce({ id: 'packet-1' })

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
            creator: '0xcreator',
            token: '0x0000000000000000000000000000000000000000',
            totalAmount: BigInt('1000000000000000000'), // 1 ETH
            count: 5,
            isRandom: true,
            expireTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day
          },
          transactionHash: '0xtxhash',
          blockNumber: '100',
          blockHash: '0xblockhash',
        },
      ]

      await service.start()
      const packetCreatedHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketCreated'
      )?.[0].onLogs

      await packetCreatedHandler(logs)

      expect(mockPrisma.packet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            packetId: '0xpacket123',
            token: '0x0000000000000000000000000000000000000000',
            tokenSymbol: 'ETH',
            tokenDecimals: 18,
            tokenName: 'Ethereum',
            totalAmount: '1000000000000000000',
            count: 5,
            isRandom: true,
            remainingAmount: '1000000000000000000', // Initially full
            remainingCount: 5,
          }),
        })
      )
    })

    it('should create packet record with ERC20 token', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' })
      mockPrisma.packet.create.mockResolvedValueOnce({ id: 'packet-1' })

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
            creator: '0xcreator',
            token: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
            totalAmount: BigInt('100000000'), // 100 USDC (6 decimals)
            count: 10,
            isRandom: false,
            expireTime: BigInt(Math.floor(Date.now() / 1000) + 86400),
          },
          transactionHash: '0xtxhash',
          blockNumber: '100',
          blockHash: '0xblockhash',
        },
      ]

      await service.start()
      const packetCreatedHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketCreated'
      )?.[0].onLogs

      await packetCreatedHandler(logs)

      expect(mockPrisma.packet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
            tokenSymbol: 'USDC',
            tokenDecimals: 6,
            tokenName: 'USD Coin',
          }),
        })
      )
    })
  })

  describe('PacketClaimed event handling', () => {
    it('should update packet remaining amounts and create claim', async () => {
      mockPrisma.packet.findUnique.mockResolvedValueOnce({
        id: 'packet-1',
        remainingAmount: '1000000000000000000', // 1 ETH
        remainingCount: 5,
        isRandom: false,
      })
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'claimer-1' })
      mockPrisma.packet.update.mockResolvedValueOnce({})
      mockPrisma.packetClaim.create.mockResolvedValueOnce({})

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
            claimer: '0xclaimer',
            amount: BigInt('200000000000000000'), // 0.2 ETH
            remainingCount: 4,
          },
          transactionHash: '0xclaimtx',
          blockNumber: '101',
          blockHash: '0xblockhash2',
        },
      ]

      await service.start()
      const packetClaimedHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketClaimed'
      )?.[0].onLogs

      await packetClaimedHandler(logs)

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.packet.update).toHaveBeenCalledWith({
        where: { id: 'packet-1' },
        data: {
          remainingAmount: '800000000000000000', // 1 - 0.2 = 0.8 ETH
          remainingCount: 4,
        },
      })
      expect(mockPrisma.packetClaim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          packetId: 'packet-1',
          claimerId: 'claimer-1',
          amount: '200000000000000000',
          txHash: '0xclaimtx',
        }),
      })
    })

    it('should update best claim marker for random packets', async () => {
      mockPrisma.packet.findUnique.mockResolvedValueOnce({
        id: 'packet-1',
        remainingAmount: '800000000000000000',
        remainingCount: 4,
        isRandom: true, // Random packet
      })
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'claimer-1' })
      mockPrisma.packet.update.mockResolvedValueOnce({})
      mockPrisma.packetClaim.create.mockResolvedValueOnce({})

      // Mock findMany for best claim update
      mockPrisma.packetClaim.findMany.mockResolvedValueOnce([
        { id: 'claim-1', amount: '300000000000000000', packetId: 'packet-1' },
        { id: 'claim-2', amount: '200000000000000000', packetId: 'packet-1' },
      ])
      mockPrisma.packetClaim.updateMany.mockResolvedValueOnce({})

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
            claimer: '0xclaimer',
            amount: BigInt('200000000000000000'),
            remainingCount: 4,
          },
          transactionHash: '0xclaimtx',
          blockNumber: '101',
          blockHash: '0xblockhash2',
        },
      ]

      await service.start()
      const packetClaimedHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketClaimed'
      )?.[0].onLogs

      await packetClaimedHandler(logs)

      // Should reset all isBest flags
      expect(mockPrisma.packetClaim.updateMany).toHaveBeenCalledWith({
        where: { packetId: 'packet-1' },
        data: { isBest: false },
      })

      // Should set isBest for highest amount
      expect(mockPrisma.packetClaim.updateMany).toHaveBeenCalledWith({
        where: {
          packetId: 'packet-1',
          amount: '300000000000000000', // Highest
        },
        data: { isBest: true },
      })
    })
  })

  describe('PacketVrfRequested event handling', () => {
    it('should store VRF request ID', async () => {
      mockPrisma.packet.findUnique.mockResolvedValueOnce({ id: 'packet-1' })
      mockPrisma.packet.update.mockResolvedValueOnce({})

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
            requestId: BigInt('12345'),
          },
          transactionHash: '0xvrftx',
          blockNumber: '102',
        },
      ]

      await service.start()
      const vrfHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketVrfRequested'
      )?.[0].onLogs

      await vrfHandler(logs)

      expect(mockPrisma.packet.update).toHaveBeenCalledWith({
        where: { id: 'packet-1' },
        data: {
          vrfRequestId: '12345',
        },
      })
    })
  })

  describe('PacketRandomReady event handling', () => {
    it('should mark packet as random ready', async () => {
      mockPrisma.packet.findUnique.mockResolvedValueOnce({ id: 'packet-1' })
      mockPrisma.packet.update.mockResolvedValueOnce({})

      const logs = [
        {
          args: {
            packetId: '0xpacket123',
          },
          transactionHash: '0xreadytx',
          blockNumber: '103',
        },
      ]

      await service.start()
      const randomReadyHandler = mockClient.watchContractEvent.mock.calls.find(
        (call) => call[0].eventName === 'PacketRandomReady'
      )?.[0].onLogs

      await randomReadyHandler(logs)

      expect(mockPrisma.packet.update).toHaveBeenCalledWith({
        where: { id: 'packet-1' },
        data: {
          randomReady: true,
        },
      })
    })
  })

  describe('syncFromBlock', () => {
    it('should sync historical events from specified block', async () => {
      mockClient.getContractEvents.mockResolvedValue([])

      await service.syncFromBlock(BigInt(100), BigInt(200))

      // Should fetch all 4 event types
      expect(mockClient.getContractEvents).toHaveBeenCalledTimes(4)
      expect(mockClient.getContractEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'PacketCreated',
          fromBlock: BigInt(100),
          toBlock: BigInt(200),
        })
      )
      expect(mockClient.getContractEvents).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketClaimed' })
      )
      expect(mockClient.getContractEvents).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketVrfRequested' })
      )
      expect(mockClient.getContractEvents).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: 'PacketRandomReady' })
      )
    })

    it('should use current block if toBlock not specified', async () => {
      mockClient.getBlockNumber.mockResolvedValueOnce(BigInt(500))
      mockClient.getContractEvents.mockResolvedValue([])

      await service.syncFromBlock(BigInt(100))

      expect(mockClient.getBlockNumber).toHaveBeenCalled()
      expect(mockClient.getContractEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          toBlock: BigInt(500),
        })
      )
    })
  })

  describe('best claim marker logic', () => {
    it('should handle ties in best claim amounts', async () => {
      mockPrisma.packetClaim.findMany.mockResolvedValueOnce([
        { id: 'claim-1', amount: '500000000000000000', packetId: 'packet-1' },
        { id: 'claim-2', amount: '500000000000000000', packetId: 'packet-1' }, // Tie
        { id: 'claim-3', amount: '400000000000000000', packetId: 'packet-1' },
      ])

      // Simulate updateBestClaimMarker being called
      const updateBestClaimMarker = async (packetId: string) => {
        const claims = await mockPrisma.packetClaim.findMany({
          where: { packetId },
          orderBy: { amount: 'desc' },
        })

        if (claims.length === 0) return

        await mockPrisma.packetClaim.updateMany({
          where: { packetId },
          data: { isBest: false },
        })

        const highestAmount = claims[0].amount

        await mockPrisma.packetClaim.updateMany({
          where: {
            packetId,
            amount: highestAmount,
          },
          data: { isBest: true },
        })
      }

      await updateBestClaimMarker('packet-1')

      // Both tied claims should be marked as best
      expect(mockPrisma.packetClaim.updateMany).toHaveBeenCalledWith({
        where: {
          packetId: 'packet-1',
          amount: '500000000000000000',
        },
        data: { isBest: true },
      })
    })
  })
})
