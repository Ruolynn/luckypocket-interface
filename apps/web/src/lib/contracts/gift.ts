/**
 * @file Gift Contract Interactions
 * @description Wrapper for DeGift smart contract interactions using wagmi/viem
 */

import {
  useContractWrite,
  useContractRead,
  usePrepareContractWrite,
  useWaitForTransaction
} from 'wagmi'
import { parseEther, parseUnits, type Address } from 'viem'
import type { GiftType } from '../gift-types'

// Contract ABIs
// TODO: Import actual ABI from contracts package
const DEGIFT_ABI = [
  {
    name: 'createGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expireTime', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: 'giftId', type: 'uint256' }],
  },
  {
    name: 'claimGift',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'refundGift',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [],
  },
] as const

// ERC20 Approve ABI
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Contract addresses (from environment)
export const DEGIFT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEGIFT_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as Address

/**
 * Hook to check ERC20 allowance
 */
export function useCheckAllowance(
  tokenAddress: Address,
  ownerAddress: Address,
  enabled = true
) {
  return useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [ownerAddress, DEGIFT_CONTRACT_ADDRESS],
    enabled: enabled && tokenAddress !== '0x0000000000000000000000000000000000000000',
    watch: true,
  })
}

/**
 * Hook to approve ERC20 tokens
 */
export function useApproveToken(tokenAddress: Address, amount: bigint) {
  const { config } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [DEGIFT_CONTRACT_ADDRESS, amount],
    enabled: tokenAddress !== '0x0000000000000000000000000000000000000000',
  })

  const { data, write, isLoading, isError, error } = useContractWrite(config)

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
  } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    approve: write,
    data,
    isLoading: isLoading || isConfirming,
    isSuccess,
    isError: isError || isConfirmError,
    error,
  }
}

/**
 * Hook to create a gift
 */
export function useCreateGift() {
  const { config, error: prepareError } = usePrepareContractWrite({
    address: DEGIFT_CONTRACT_ADDRESS,
    abi: DEGIFT_ABI,
    functionName: 'createGift',
  })

  const { data, write, writeAsync, isLoading, isError, error } = useContractWrite(config)

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
  } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    createGift: write,
    createGiftAsync: writeAsync,
    data,
    isLoading: isLoading || isConfirming,
    isSuccess,
    isError: isError || isConfirmError,
    error: error || prepareError,
    txHash: data?.hash,
  }
}

/**
 * Hook to claim a gift
 */
export function useClaimGift(giftId: bigint, enabled = true) {
  const { config, error: prepareError } = usePrepareContractWrite({
    address: DEGIFT_CONTRACT_ADDRESS,
    abi: DEGIFT_ABI,
    functionName: 'claimGift',
    args: [giftId],
    enabled,
  })

  const { data, write, writeAsync, isLoading, isError, error } = useContractWrite(config)

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
  } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    claimGift: write,
    claimGiftAsync: writeAsync,
    data,
    isLoading: isLoading || isConfirming,
    isSuccess,
    isError: isError || isConfirmError,
    error: error || prepareError,
    txHash: data?.hash,
  }
}

/**
 * Hook to refund a gift
 */
export function useRefundGift(giftId: bigint, enabled = true) {
  const { config, error: prepareError } = usePrepareContractWrite({
    address: DEGIFT_CONTRACT_ADDRESS,
    abi: DEGIFT_ABI,
    functionName: 'refundGift',
    args: [giftId],
    enabled,
  })

  const { data, write, writeAsync, isLoading, isError, error } = useContractWrite(config)

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
  } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    refundGift: write,
    refundGiftAsync: writeAsync,
    data,
    isLoading: isLoading || isConfirming,
    isSuccess,
    isError: isError || isConfirmError,
    error: error || prepareError,
    txHash: data?.hash,
  }
}

/**
 * Utility: Parse amount based on gift type and token decimals
 */
export function parseGiftAmount(
  amount: string,
  giftType: GiftType,
  decimals: number = 18
): bigint {
  if (giftType === 'NFT') {
    // NFT tokenId
    return BigInt(amount)
  }

  // Token amount
  return parseUnits(amount, decimals)
}

/**
 * Utility: Calculate expire timestamp
 */
export function calculateExpireTime(days: number): bigint {
  const now = Math.floor(Date.now() / 1000)
  const expirySeconds = days * 24 * 60 * 60
  return BigInt(now + expirySeconds)
}

/**
 * Utility: Format address for display
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Utility: Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
