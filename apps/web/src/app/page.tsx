'use client'
import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Home() {
  const { isAuthenticated, user } = useAuthContext()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🧧 HongBao dApp
          </h1>
          <p className="text-xl text-gray-600">
            Base 链上的社交红包 dApp
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <AuthButton />
        </div>

        {isAuthenticated && user && (
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600">
              已登录: {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/packets/create"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-center"
          >
            ➕ 创建红包
          </Link>
          <Link
            href="/leaderboard"
            className="bg-success-500 hover:bg-success-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-center"
          >
            🏆 排行榜
          </Link>
          <Link
            href="/invite"
            className="bg-warning-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-center"
          >
            🎁 邀请奖励
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">功能说明</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-center">
              <span className="text-success-500 mr-2">✅</span>
              <span>创建红包（固定/随机金额）</span>
            </li>
            <li className="flex items-center">
              <span className="text-success-500 mr-2">✅</span>
              <span>领取红包</span>
            </li>
            <li className="flex items-center">
              <span className="text-success-500 mr-2">✅</span>
              <span>实时查看领取记录</span>
            </li>
            <li className="flex items-center">
              <span className="text-primary-500 mr-2">🔄</span>
              <span>排行榜（开发中）</span>
            </li>
            <li className="flex items-center">
              <span className="text-primary-500 mr-2">🔄</span>
              <span>邀请奖励（开发中）</span>
            </li>
            <li className="flex items-center">
              <span className="text-primary-500 mr-2">🔄</span>
              <span>Farcaster Frames（开发中）</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
