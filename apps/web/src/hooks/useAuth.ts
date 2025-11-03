'use client'
import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { api } from '@/utils/api'

export function useAuth() {
  const { address, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [jwt, setJwt] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt')
    }
    return null
  })
  const [user, setUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  })

  const signIn = useCallback(async () => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    setIsAuthenticating(true)
    try {
      // 1. 获取 nonce
      const { nonce } = await api('/api/auth/siwe/nonce')

      // 2. 创建 SIWE 消息
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: '登录 HongBao dApp',
        uri: window.location.origin,
        version: '1',
        chainId: chain?.id || 11155111, // 默认 Sepolia
        nonce,
      })

      const messageStr = message.prepareMessage()

      // 3. 签名
      const signature = await signMessageAsync({ message: messageStr })

      // 4. 验证并获取 JWT
      const result = await api('/api/auth/siwe/verify', {
        method: 'POST',
        body: JSON.stringify({ message: messageStr, signature }),
      })

      // 5. 保存到本地存储
      localStorage.setItem('jwt', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setJwt(result.token)
      setUser(result.user)

      return result
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, chain, signMessageAsync])

  const signOut = useCallback(() => {
    localStorage.removeItem('jwt')
    localStorage.removeItem('user')
    setJwt(null)
    setUser(null)
  }, [])

  return {
    jwt,
    user,
    isAuthenticated: !!jwt && !!user,
    isAuthenticating,
    signIn,
    signOut,
  }
}
