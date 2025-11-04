import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { apiClient } from '@/lib/api'

export function useClaimPacket() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimResult, setClaimResult] = useState<any>(null)

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const claimPacket = async (packetId: string) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsSubmitting(true)

      // TODO: Call smart contract
      // writeContract({
      //   address: RED_PACKET_CONTRACT_ADDRESS,
      //   abi: redPacketAbi,
      //   functionName: 'claimPacket',
      //   args: [packetId],
      // })

      // For now, submit to API (backend proxy)
      const result = await apiClient.claimPacket({ packetId })
      setClaimResult(result)
      return result
    } catch (err) {
      console.error('Failed to claim packet:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setClaimResult(null)
  }

  return {
    claimPacket,
    isPending: isPending || isSubmitting,
    isConfirming,
    isConfirmed,
    error,
    hash,
    claimResult,
    reset,
  }
}
