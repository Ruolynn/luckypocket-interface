// App constants

export const APP_NAME = 'LuckyPacket'
export const APP_DESCRIPTION = 'Web3 Lucky Packet dApp'

// Chain configuration
export const DEFAULT_CHAIN_ID = 8453 // Base Mainnet
export const SUPPORTED_CHAINS = [8453, 84532] // Base Mainnet, Base Sepolia

// Contract addresses (update with deployed addresses)
export const RED_PACKET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS || ''

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Packet limits
export const MAX_PACKET_COUNT = 100
export const MIN_PACKET_COUNT = 1
export const MAX_DURATION_DAYS = 7
export const MIN_DURATION_HOURS = 1
export const MAX_MESSAGE_LENGTH = 100

