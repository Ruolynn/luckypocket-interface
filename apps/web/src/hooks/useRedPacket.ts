import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseAbiItem, encodeFunctionData, parseEther } from 'viem'
import { RED_PACKET_ABI } from '../constants/abi'

const RED_PACKET_ADDRESS = (process.env.NEXT_PUBLIC_RED_PACKET_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000'

export function useRedPacketContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createPacket = async (
    token: `0x${string}`,
    totalAmount: bigint,
    count: number,
    isRandom: boolean,
    duration: bigint,
    salt: `0x${string}`
  ) => {
    return writeContract({
      address: RED_PACKET_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'createPacket',
      args: [token, totalAmount, count, isRandom, duration, salt],
    })
  }

  const claimPacket = async (packetId: `0x${string}`) => {
    return writeContract({
      address: RED_PACKET_ADDRESS,
      abi: RED_PACKET_ABI,
      functionName: 'claimPacket',
      args: [packetId],
    })
  }

  return {
    createPacket,
    claimPacket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function usePacketInfo(packetId: `0x${string}` | undefined) {
  return useReadContract({
    address: packetId ? RED_PACKET_ADDRESS : undefined,
    abi: RED_PACKET_ABI,
    functionName: 'getPacketInfo',
    args: packetId ? [packetId] : undefined,
    query: { enabled: !!packetId },
  })
}

