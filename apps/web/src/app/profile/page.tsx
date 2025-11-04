'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

interface PacketStats {
  created: number
  claimed: number
  totalSent: string
  totalReceived: string
}

export default function ProfilePage() {
  const { isConnected: realIsConnected, address: realAddress } = useAccount()
  const [isTestMode, setIsTestMode] = useState(false)
  const [mockConnected, setMockConnected] = useState(false)

  useEffect(() => {
    const testMode = localStorage.getItem('testMode') === 'true'
    const mockWallet = localStorage.getItem('mockWalletConnected') === 'true'
    setIsTestMode(testMode)
    setMockConnected(mockWallet)
  }, [])

  const isConnected = isTestMode ? mockConnected : realIsConnected
  const address = isTestMode ? (mockConnected ? '0x1234...5678' : undefined) : realAddress

  const stats: PacketStats = {
    created: 12,
    claimed: 8,
    totalSent: '0.25',
    totalReceived: '0.15',
  }

  const recentActivity = [
    {
      type: 'created',
      amount: '0.05 ETH',
      timestamp: Date.now() - 3600000,
      message: 'Happy Birthday!',
    },
    {
      type: 'claimed',
      amount: '0.0031 ETH',
      timestamp: Date.now() - 7200000,
      from: 'vbuterin.eth',
    },
    {
      type: 'created',
      amount: '0.1 ETH',
      timestamp: Date.now() - 86400000,
      message: 'Team bonus!',
    },
  ]

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-3 xs:px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <span className="material-symbols-outlined text-primary text-5xl">
                person
              </span>
            </div>
            <h1 className="text-2xl xs:text-3xl font-black text-text-primary-light mb-3">
              View Your Profile
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light mb-6 max-w-md">
              Connect your wallet to view your profile, stats, and activity history
            </p>
            <ConnectButton />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight">
              Profile
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light mt-1">
              View and manage your Lucky Packet profile
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 bg-surface-light border border-gray-200 rounded-lg text-sm font-medium text-text-primary-light hover:bg-gray-100 transition-colors touch-manipulation"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl sm:text-4xl font-bold flex-shrink-0">
              {address?.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light mb-2">
                Anonymous User
              </h2>
              <p className="text-sm xs:text-base text-text-secondary-light font-mono mb-4">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors">
                  Early Adopter
                </button>
                <button className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-full hover:bg-accent/20 transition-colors">
                  Lucky 🍀
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
              <p className="text-xs xs:text-sm text-text-secondary-light">Created</p>
            </div>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.created}</p>
            <p className="text-xs text-text-secondary-light mt-1">{stats.totalSent} ETH sent</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-accent text-xl">redeem</span>
              <p className="text-xs xs:text-sm text-text-secondary-light">Claimed</p>
            </div>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.claimed}</p>
            <p className="text-xs text-text-secondary-light mt-1">{stats.totalReceived} ETH received</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-yellow-600 text-xl">star</span>
              <p className="text-xs xs:text-sm text-text-secondary-light">Lucky Claims</p>
            </div>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">3</p>
            <p className="text-xs text-text-secondary-light mt-1">Above average</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-600 text-xl">group</span>
              <p className="text-xs xs:text-sm text-text-secondary-light">Invites</p>
            </div>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">5</p>
            <p className="text-xs text-text-secondary-light mt-1">Friends joined</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
          <h2 className="text-lg xs:text-xl font-bold text-text-primary-light mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 xs:p-4 bg-surface-light rounded-lg border border-gray-200"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'created'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {activity.type === 'created' ? 'add_circle' : 'redeem'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary-light">
                      {activity.type === 'created' ? 'Created packet' : 'Claimed packet'}
                      {activity.type === 'claimed' && activity.from && (
                        <span className="text-text-secondary-light"> from {activity.from}</span>
                      )}
                    </p>
                    {activity.message && (
                      <p className="text-xs text-text-secondary-light mt-1">"{activity.message}"</p>
                    )}
                    <p className="text-xs text-text-secondary-light mt-1">
                      {Math.floor((Date.now() - activity.timestamp) / 60000)} minutes ago
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-text-primary-light whitespace-nowrap ml-2">
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
            >
              View All Activity
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
          <Link
            href="/create"
            className="flex items-center gap-4 p-4 xs:p-6 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-shadow touch-manipulation"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">add_circle</span>
            </div>
            <div>
              <p className="text-base xs:text-lg font-bold">Create Packet</p>
              <p className="text-xs xs:text-sm text-white/90">Share luck with friends</p>
            </div>
          </Link>

          <Link
            href="/invite"
            className="flex items-center gap-4 p-4 xs:p-6 bg-gradient-to-r from-accent to-accent/80 text-white rounded-xl hover:shadow-lg transition-shadow touch-manipulation"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">group_add</span>
            </div>
            <div>
              <p className="text-base xs:text-lg font-bold">Invite Friends</p>
              <p className="text-xs xs:text-sm text-white/90">Grow your network</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
