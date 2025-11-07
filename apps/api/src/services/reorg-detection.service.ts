/**
 * @file Blockchain Reorg Detection Service
 * @description Detect blockchain reorganizations and handle data consistency
 */

import type { PrismaClient } from '@prisma/client'
import { createPublicClient, http, type Block } from 'viem'
import { sepolia } from 'viem/chains'

export interface ReorgDetectionConfig {
  rpcUrl: string
  chainId: number
  checkDepth?: number // How many blocks back to check (default: 12)
  checkInterval?: number // How often to check in ms (default: 60000 = 1 minute)
}

export class ReorgDetectionService {
  private client: ReturnType<typeof createPublicClient>
  private config: ReorgDetectionConfig
  private prisma: PrismaClient
  private isRunning = false
  private checkTimer?: NodeJS.Timeout

  constructor(config: ReorgDetectionConfig, prisma: PrismaClient) {
    this.config = {
      ...config,
      checkDepth: config.checkDepth || 12, // ~3 minutes on Sepolia
      checkInterval: config.checkInterval || 60_000, // 1 minute
    }
    this.prisma = prisma

    this.client = createPublicClient({
      chain: sepolia,
      transport: http(config.rpcUrl),
    })
  }

  /**
   * Start periodic reorg detection
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Reorg detection already running')
      return
    }

    console.log('\n🔍 Starting reorg detection service...')
    console.log(`   Check depth: ${this.config.checkDepth} blocks`)
    console.log(`   Check interval: ${this.config.checkInterval}ms\n`)

    this.isRunning = true

    // Run initial check
    await this.checkForReorgs()

    // Schedule periodic checks
    this.checkTimer = setInterval(async () => {
      await this.checkForReorgs()
    }, this.config.checkInterval)

    console.log('✅ Reorg detection service started')
  }

  /**
   * Stop reorg detection
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️  Reorg detection not running')
      return
    }

    console.log('\n🛑 Stopping reorg detection service...')

    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = undefined
    }

    this.isRunning = false
    console.log('✅ Reorg detection service stopped\n')
  }

  /**
   * Check for blockchain reorganizations
   */
  private async checkForReorgs() {
    try {
      const currentBlock = await this.client.getBlockNumber()
      const checkFromBlock = currentBlock - BigInt(this.config.checkDepth!)

      console.log(`🔍 Checking for reorgs from block ${checkFromBlock} to ${currentBlock}...`)

      // Get all stored records with blockNumber in range
      const [packets, packetClaims] = await Promise.all([
        this.prisma.packet.findMany({
          where: {
            blockNumber: {
              gte: checkFromBlock,
              lte: currentBlock,
            },
            blockHash: {
              not: null,
            },
          },
          select: {
            id: true,
            packetId: true,
            blockNumber: true,
            blockHash: true,
          },
        }),
        this.prisma.packetClaim.findMany({
          where: {
            blockNumber: {
              gte: checkFromBlock,
              lte: currentBlock,
            },
            blockHash: {
              not: null,
            },
          },
          select: {
            id: true,
            txHash: true,
            blockNumber: true,
            blockHash: true,
            packetId: true,
          },
        }),
      ])

      if (packets.length === 0 && packetClaims.length === 0) {
        console.log('   No records to check')
        return
      }

      console.log(`   Checking ${packets.length} packets and ${packetClaims.length} claims...`)

      // Fetch actual block hashes from chain
      const blockNumbers = new Set<bigint>()
      packets.forEach((p) => p.blockNumber && blockNumbers.add(p.blockNumber))
      packetClaims.forEach((c) => c.blockNumber && blockNumbers.add(c.blockNumber))

      const blockHashMap = new Map<bigint, string>()
      for (const blockNumber of blockNumbers) {
        try {
          const block = await this.client.getBlock({ blockNumber })
          blockHashMap.set(blockNumber, block.hash)
        } catch (error) {
          console.warn(`   ⚠️  Failed to fetch block ${blockNumber}:`, error)
        }
      }

      // Check for mismatches (reorg detected)
      const reorgedPackets: string[] = []
      const reorgedClaims: string[] = []

      for (const packet of packets) {
        if (!packet.blockNumber || !packet.blockHash) continue
        const actualHash = blockHashMap.get(packet.blockNumber)
        if (actualHash && actualHash !== packet.blockHash) {
          console.log(
            `   🔄 Reorg detected for packet ${packet.packetId} at block ${packet.blockNumber}`
          )
          reorgedPackets.push(packet.id)
        }
      }

      for (const claim of packetClaims) {
        if (!claim.blockNumber || !claim.blockHash) continue
        const actualHash = blockHashMap.get(claim.blockNumber)
        if (actualHash && actualHash !== claim.blockHash) {
          console.log(`   🔄 Reorg detected for claim ${claim.txHash} at block ${claim.blockNumber}`)
          reorgedClaims.push(claim.id)
        }
      }

      // Handle reorged records
      if (reorgedPackets.length > 0 || reorgedClaims.length > 0) {
        console.log(`\n⚠️  Handling ${reorgedPackets.length} reorged packets and ${reorgedClaims.length} reorged claims...`)
        await this.handleReorgedRecords(reorgedPackets, reorgedClaims)
      } else {
        console.log('   ✅ No reorgs detected')
      }
    } catch (error) {
      console.error('❌ Failed to check for reorgs:', error)
    }
  }

  /**
   * Handle records affected by reorg
   * Strategy: Delete affected records and let event listener re-sync them
   */
  private async handleReorgedRecords(packetIds: string[], claimIds: string[]) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete reorged packet claims first (due to foreign key)
        if (claimIds.length > 0) {
          const deletedClaims = await tx.packetClaim.deleteMany({
            where: {
              id: {
                in: claimIds,
              },
            },
          })
          console.log(`   🗑️  Deleted ${deletedClaims.count} reorged claims`)
        }

        // Delete reorged packets
        if (packetIds.length > 0) {
          const deletedPackets = await tx.packet.deleteMany({
            where: {
              id: {
                in: packetIds,
              },
            },
          })
          console.log(`   🗑️  Deleted ${deletedPackets.count} reorged packets`)
        }
      })

      console.log('   ✅ Reorged records deleted successfully')
      console.log('   💡 Event listeners will re-sync correct data on next poll')
    } catch (error) {
      console.error('   ❌ Failed to handle reorged records:', error)
      throw error
    }
  }

  /**
   * Manually trigger a reorg check (for testing/debugging)
   */
  async triggerCheck() {
    console.log('\n🔍 Manual reorg check triggered...')
    await this.checkForReorgs()
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
    }
  }
}
