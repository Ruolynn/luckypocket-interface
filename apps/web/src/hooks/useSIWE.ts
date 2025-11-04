import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { apiClient } from '@/lib/api'

export function useSIWE() {
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signIn = useCallback(async () => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // 1. Get nonce from backend
      const { nonce } = await apiClient.getNonce()

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to LuckyPacket dApp',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      })

      const preparedMessage = message.prepareMessage()

      // 3. Sign message
      const signature = await signMessageAsync({
        message: preparedMessage,
      })

      // 4. Verify signature with backend
      const result = await apiClient.verifySignature({
        message: preparedMessage,
        signature,
      })

      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId, signMessageAsync])

  const signOut = useCallback(() => {
    apiClient.clearToken()
  }, [])

  return {
    signIn,
    signOut,
    isLoading,
    error,
  }
}
