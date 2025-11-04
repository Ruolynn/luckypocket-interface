/**
 * @file Smart Contract Configurations
 * @description Contract addresses and ABIs for DeGift
 */

// TODO: Import actual contract ABI when available
// import { DeGiftAbi } from '@/lib/abi/DeGift'

/**
 * DeGift contract configuration
 */
export const degiftContract = {
  // Contract address from environment variable
  address: (process.env.NEXT_PUBLIC_DEGIFT_CONTRACT || '0x') as `0x${string}`,
  // TODO: Add actual ABI when contract is deployed
  abi: [] as const,
} as const

/**
 * All contract configurations
 */
export const contracts = {
  degift: degiftContract,
} as const

/**
 * Get contract by name
 */
export function getContract(name: keyof typeof contracts) {
  return contracts[name]
}
