/**
 * @file RedPacket Event Listener Service
 * @description Listen to RedPacket contract events and sync to database
 */

import type { PrismaClient } from '@prisma/client'
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  type Log,
  type WatchContractEventReturnType,
} from 'viem'
import { sepolia } from 'viem/chains'
import { RedPacketAbi } from '../abi/RedPacket'
import { getTokenMetadata } from './contract.service'

export interface RedPacketListenerConfig {
  rpcUrl: string
  contractAddress: Address
  chainId: number
  pollingInterval?: number
}

export class RedPacketListenerService {
  private client: ReturnType<typeof createPublicClient>
  private config: RedPacketListenerConfig
  private prisma: PrismaClient
  private unwatchFunctions: WatchContractEventReturnType[] = []
  private isListening = false

  constructor(config: RedPacketListenerConfig, prisma: PrismaClient) {
    this.config = config
    this.prisma = prisma

    this.client = createPublicClient({
      chain: sepolia,
      transport: http(config.rpcUrl),
      pollingInterval: config.pollingInterval || 4_000, // 4 seconds
    })
  }

  /**
   * Start listening to contract events
   */
  async start() {
    if (this.isListening) {
      console.log('⚠️  RedPacket event listener already running')
      return
    }

    console.log('\n🎧 Starting RedPacket event listener...')
    console.log(`   Contract: ${this.config.contractAddress}`)
    console.log(`   Chain ID: ${this.config.chainId}`)
    console.log(`   Polling interval: ${this.config.pollingInterval || 4000}ms\n`)

    try {
      // Listen to PacketCreated events
      const unwatchCreated = this.client.watchContractEvent({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketCreated',
        onLogs: (logs) => this.handlePacketCreatedLogs(logs),
        onError: (error) => console.error('PacketCreated watch error:', error),
        pollingInterval: this.config.pollingInterval,
      })

      // Listen to PacketClaimed events
      const unwatchClaimed = this.client.watchContractEvent({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketClaimed',
        onLogs: (logs) => this.handlePacketClaimedLogs(logs),
        onError: (error) => console.error('PacketClaimed watch error:', error),
        pollingInterval: this.config.pollingInterval,
      })

      // Listen to PacketVrfRequested events
      const unwatchVrfRequested = this.client.watchContractEvent({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketVrfRequested',
        onLogs: (logs) => this.handlePacketVrfRequestedLogs(logs),
        onError: (error) => console.error('PacketVrfRequested watch error:', error),
        pollingInterval: this.config.pollingInterval,
      })

      // Listen to PacketRandomReady events
      const unwatchRandomReady = this.client.watchContractEvent({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketRandomReady',
        onLogs: (logs) => this.handlePacketRandomReadyLogs(logs),
        onError: (error) => console.error('PacketRandomReady watch error:', error),
        pollingInterval: this.config.pollingInterval,
      })

      this.unwatchFunctions = [unwatchCreated, unwatchClaimed, unwatchVrfRequested, unwatchRandomReady]
      this.isListening = true

      console.log('✅ RedPacket event listener started successfully')
      console.log('   Listening for: PacketCreated, PacketClaimed, PacketVrfRequested, PacketRandomReady\n')
    } catch (error) {
      console.error('❌ Failed to start RedPacket event listener:', error)
      throw error
    }
  }

  /**
   * Stop listening to events
   */
  async stop() {
    if (!this.isListening) {
      console.log('⚠️  RedPacket event listener not running')
      return
    }

    console.log('\n🛑 Stopping RedPacket event listener...')

    // Unwatch all events
    this.unwatchFunctions.forEach((unwatch) => unwatch())
    this.unwatchFunctions = []
    this.isListening = false

    console.log('✅ RedPacket event listener stopped\n')
  }

  /**
   * Handle PacketCreated events
   */
  private async handlePacketCreatedLogs(logs: Log[]) {
    for (const log of logs) {
      try {
        // Parse event args
        const { args, transactionHash, blockNumber, blockHash } = log as any

        const { packetId, creator, token, totalAmount, count, isRandom, expireTime } = args

        console.log(`\n🧧 PacketCreated event detected`)
        console.log(`   Packet ID: ${packetId}`)
        console.log(`   Tx: ${transactionHash}`)
        console.log(`   Block: ${blockNumber}`)

        // Get token metadata
        let metadata: { symbol: string | null; decimals: number | null; name: string | null } = {
          symbol: null,
          decimals: null,
          name: null,
        }
        try {
          if (token !== '0x0000000000000000000000000000000000000000') {
            metadata = await getTokenMetadata(token as Address)
          } else {
            metadata = { symbol: 'ETH', decimals: 18, name: 'Ethereum' }
          }
        } catch (error) {
          console.warn(`   ⚠️  Failed to fetch token metadata for ${token}`)
        }

        // Calculate expiry date
        const expireTimeDate = new Date(Number(expireTime) * 1000)

        // Get or create creator user
        const creatorUser = await this.getOrCreateUser(creator)

        // Create packet record in database
        await this.prisma.packet.create({
          data: {
            packetId: packetId as string,
            txHash: transactionHash as string,
            chainId: this.config.chainId,
            creatorId: creatorUser.id,
            token: (token as string).toLowerCase(),
            tokenSymbol: metadata.symbol,
            tokenDecimals: metadata.decimals,
            tokenName: metadata.name,
            totalAmount: (totalAmount as bigint).toString(),
            count: Number(count),
            isRandom: isRandom as boolean,
            message: null, // Message is stored off-chain in metadata
            remainingAmount: (totalAmount as bigint).toString(), // Initially full
            remainingCount: Number(count), // Initially all claims available
            expireTime: expireTimeDate,
            blockNumber: blockNumber ? BigInt(blockNumber as string) : null,
            blockHash: blockHash as string,
          },
        })

        console.log(`   ✅ Packet saved to database`)
      } catch (error: any) {
        console.error(`   ❌ Failed to handle PacketCreated event:`, error.message || error)
      }
    }
  }

  /**
   * Handle PacketClaimed events
   */
  private async handlePacketClaimedLogs(logs: Log[]) {
    for (const log of logs) {
      try {
        const { args, transactionHash, blockNumber, blockHash } = log as any
        const { packetId, claimer, amount, remainingCount } = args

        console.log(`\n🎉 PacketClaimed event detected`)
        console.log(`   Packet ID: ${packetId}`)
        console.log(`   Tx: ${transactionHash}`)
        console.log(`   Block: ${blockNumber}`)

        // Find packet in database
        const packet = await this.prisma.packet.findUnique({
          where: { packetId: packetId as string },
        })

        if (!packet) {
          console.error(`   ❌ Packet not found in database: ${packetId}`)
          continue
        }

        // Get or create claimer user
        const claimerUser = await this.getOrCreateUser(claimer)

        // Calculate new remaining amount
        const claimAmount = BigInt(amount as bigint)
        const currentRemaining = BigInt(packet.remainingAmount)
        const newRemaining = currentRemaining - claimAmount

        // Update packet and create claim record in transaction
        await this.prisma.$transaction(async (tx) => {
          // Update packet remaining amounts
          await tx.packet.update({
            where: { id: packet.id },
            data: {
              remainingAmount: newRemaining.toString(),
              remainingCount: Number(remainingCount),
            },
          })

          // Create claim record
          await tx.packetClaim.create({
            data: {
              packetId: packet.id,
              claimerId: claimerUser.id,
              amount: claimAmount.toString(),
              txHash: transactionHash as string,
              blockNumber: blockNumber ? BigInt(blockNumber as string) : null,
              blockHash: blockHash as string,
            },
          })
        })

        // Update best claim marker if this is a random packet
        if (packet.isRandom) {
          await this.updateBestClaimMarker(packet.id)
        }

        console.log(`   ✅ Packet claim saved to database`)
      } catch (error: any) {
        console.error(`   ❌ Failed to handle PacketClaimed event:`, error.message || error)
      }
    }
  }

  /**
   * Handle PacketVrfRequested events
   */
  private async handlePacketVrfRequestedLogs(logs: Log[]) {
    for (const log of logs) {
      try {
        const { args, transactionHash, blockNumber } = log as any
        const { packetId, requestId } = args

        console.log(`\n🎲 PacketVrfRequested event detected`)
        console.log(`   Packet ID: ${packetId}`)
        console.log(`   Request ID: ${requestId}`)
        console.log(`   Tx: ${transactionHash}`)
        console.log(`   Block: ${blockNumber}`)

        // Find packet in database
        const packet = await this.prisma.packet.findUnique({
          where: { packetId: packetId as string },
        })

        if (!packet) {
          console.error(`   ❌ Packet not found in database: ${packetId}`)
          continue
        }

        // Update VRF request ID
        await this.prisma.packet.update({
          where: { id: packet.id },
          data: {
            vrfRequestId: (requestId as bigint).toString(),
          },
        })

        console.log(`   ✅ VRF request ID saved to database`)
      } catch (error: any) {
        console.error(`   ❌ Failed to handle PacketVrfRequested event:`, error.message || error)
      }
    }
  }

  /**
   * Handle PacketRandomReady events
   */
  private async handlePacketRandomReadyLogs(logs: Log[]) {
    for (const log of logs) {
      try {
        const { args, transactionHash, blockNumber } = log as any
        const { packetId } = args

        console.log(`\n✨ PacketRandomReady event detected`)
        console.log(`   Packet ID: ${packetId}`)
        console.log(`   Tx: ${transactionHash}`)
        console.log(`   Block: ${blockNumber}`)

        // Find packet in database
        const packet = await this.prisma.packet.findUnique({
          where: { packetId: packetId as string },
        })

        if (!packet) {
          console.error(`   ❌ Packet not found in database: ${packetId}`)
          continue
        }

        // Mark packet as random ready
        await this.prisma.packet.update({
          where: { id: packet.id },
          data: {
            randomReady: true,
          },
        })

        console.log(`   ✅ Packet marked as random ready`)
      } catch (error: any) {
        console.error(`   ❌ Failed to handle PacketRandomReady event:`, error.message || error)
      }
    }
  }

  /**
   * Update "best claim" marker (手气最佳) for a packet
   * Only the claim with the highest amount gets marked as isBest
   */
  private async updateBestClaimMarker(packetId: string) {
    try {
      // Get all claims for this packet
      const claims = await this.prisma.packetClaim.findMany({
        where: { packetId },
        orderBy: { amount: 'desc' },
      })

      if (claims.length === 0) return

      // Reset all isBest flags first
      await this.prisma.packetClaim.updateMany({
        where: { packetId },
        data: { isBest: false },
      })

      // Find the highest amount (first in descending order)
      const highestAmount = claims[0].amount

      // Set isBest for all claims with the highest amount (handle ties)
      await this.prisma.packetClaim.updateMany({
        where: {
          packetId,
          amount: highestAmount,
        },
        data: { isBest: true },
      })

      console.log(`   💰 Updated best claim marker (highest: ${highestAmount})`)
    } catch (error: any) {
      console.error(`   ⚠️  Failed to update best claim marker:`, error.message || error)
    }
  }

  /**
   * Get or create user by wallet address
   */
  private async getOrCreateUser(address: Address) {
    const lowerAddress = address.toLowerCase()

    let user = await this.prisma.user.findUnique({
      where: { address: lowerAddress },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          address: lowerAddress,
        },
      })
      console.log(`   👤 Created new user: ${lowerAddress}`)
    }

    return user
  }

  /**
   * Sync historical events from a specific block
   */
  async syncFromBlock(fromBlock: bigint, toBlock?: bigint) {
    console.log(`\n📜 Syncing RedPacket events from block ${fromBlock}...`)

    const currentBlock = await this.client.getBlockNumber()
    const endBlock = toBlock || currentBlock

    try {
      // Fetch PacketCreated events
      const createdLogs = await this.client.getContractEvents({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketCreated',
        fromBlock,
        toBlock: endBlock,
      })

      // Fetch PacketClaimed events
      const claimedLogs = await this.client.getContractEvents({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketClaimed',
        fromBlock,
        toBlock: endBlock,
      })

      // Fetch PacketVrfRequested events
      const vrfRequestedLogs = await this.client.getContractEvents({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketVrfRequested',
        fromBlock,
        toBlock: endBlock,
      })

      // Fetch PacketRandomReady events
      const randomReadyLogs = await this.client.getContractEvents({
        address: this.config.contractAddress,
        abi: RedPacketAbi,
        eventName: 'PacketRandomReady',
        fromBlock,
        toBlock: endBlock,
      })

      console.log(`   Found ${createdLogs.length} PacketCreated events`)
      console.log(`   Found ${claimedLogs.length} PacketClaimed events`)
      console.log(`   Found ${vrfRequestedLogs.length} PacketVrfRequested events`)
      console.log(`   Found ${randomReadyLogs.length} PacketRandomReady events`)

      // Process events in order
      await this.handlePacketCreatedLogs(createdLogs as Log[])
      await this.handlePacketVrfRequestedLogs(vrfRequestedLogs as Log[])
      await this.handlePacketRandomReadyLogs(randomReadyLogs as Log[])
      await this.handlePacketClaimedLogs(claimedLogs as Log[])

      console.log(`✅ Sync completed!\n`)
    } catch (error) {
      console.error(`❌ Failed to sync events:`, error)
      throw error
    }
  }
}
