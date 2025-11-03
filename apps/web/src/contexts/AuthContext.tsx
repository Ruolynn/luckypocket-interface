'use client'
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/useAuth'

interface AuthContextValue {
  jwt: string | null
  user: any | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  signIn: () => Promise<any>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { address, isConnected } = useAccount()

  // 当钱包断开连接时，自动清除认证
  useEffect(() => {
    if (!isConnected && auth.isAuthenticated) {
      auth.signOut()
    }
  }, [isConnected, auth.isAuthenticated])

  // 当钱包地址变化时，自动清除认证
  useEffect(() => {
    if (address && auth.user && address.toLowerCase() !== auth.user.address.toLowerCase()) {
      auth.signOut()
    }
  }, [address, auth.user])

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
