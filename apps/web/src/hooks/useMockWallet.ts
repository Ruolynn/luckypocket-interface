import { useState, useEffect } from 'react'

interface MockWalletState {
  isConnected: boolean
  address: string | undefined
  toggleConnection: () => void
}

/**
 * Mock wallet hook for testing UI without real wallet connection
 * Usage: Set NEXT_PUBLIC_MOCK_WALLET=true in .env.local to enable mock mode
 */
export function useMockWallet(): MockWalletState {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | undefined>(undefined)

  // Check if mock mode is enabled
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_WALLET === 'true'

  useEffect(() => {
    if (isMockMode) {
      // Check localStorage for saved connection state
      const savedState = localStorage.getItem('mockWalletConnected')
      if (savedState === 'true') {
        setIsConnected(true)
        setAddress('0x1234...5678') // Mock address
      }
    }
  }, [isMockMode])

  const toggleConnection = () => {
    const newState = !isConnected
    setIsConnected(newState)
    setAddress(newState ? '0x1234...5678' : undefined)

    if (isMockMode) {
      localStorage.setItem('mockWalletConnected', String(newState))
    }
  }

  return {
    isConnected,
    address,
    toggleConnection,
  }
}
