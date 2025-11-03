'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useAuthContext } from '@/contexts/AuthContext'

export function AuthButton() {
  const { isConnected } = useAccount()
  const { isAuthenticated, isAuthenticating, signIn, signOut } = useAuthContext()

  return (
    <div className="flex items-center gap-4">
      <ConnectButton />
      {isConnected && !isAuthenticated && (
        <button
          onClick={signIn}
          disabled={isAuthenticating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
        >
          {isAuthenticating ? '认证中...' : '签名登录'}
        </button>
      )}
      {isAuthenticated && (
        <button
          onClick={signOut}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
        >
          退出登录
        </button>
      )}
    </div>
  )
}
