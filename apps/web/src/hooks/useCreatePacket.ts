import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { apiClient } from '@/lib/api'
import type { CreatePacketRequest } from '@/lib/types'

export function useCreatePacket() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const createPacket = async (params: {
    token: string
    amount: string
    count: number
    isRandom: boolean
    message: string
    expiresInDays: number
  }) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsSubmitting(true)

      // Calculate expiry time
      const expireTime = new Date(
        Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000
      ).toISOString()

      // TODO: Call smart contract
      // const decimals = await readContract({
      //   address: params.token,
      //   abi: erc20Abi,
      //   functionName: 'decimals',
      // })
      // const amountWei = parseUnits(params.amount, decimals)

      // writeContract({
      //   address: RED_PACKET_CONTRACT_ADDRESS,
      //   abi: redPacketAbi,
      //   functionName: 'createPacket',
      //   args: [params.token, amountWei, params.count, params.isRandom, params.message],
      // })

      // For now, submit to API
      const requestData: CreatePacketRequest = {
        token: params.token,
        totalAmount: params.amount,
        count: params.count,
        isRandom: params.isRandom,
        message: params.message,
        expireTime,
      }

      const result = await apiClient.createPacket(requestData)
      return result
    } catch (err) {
      console.error('Failed to create packet:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    createPacket,
    isPending: isPending || isSubmitting,
    isConfirming,
    isConfirmed,
    error,
    hash,
  }
}
