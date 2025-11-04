'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import { useAccount } from 'wagmi'
import Link from 'next/link'

type SettingsTab = 'profile' | 'wallet' | 'notifications' | 'security'

export default function SettingsPage() {
  const { address: realAddress } = useAccount()
  const [isTestMode, setIsTestMode] = useState(false)
  const [mockConnected, setMockConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  useEffect(() => {
    const testMode = localStorage.getItem('testMode') === 'true'
    const mockWallet = localStorage.getItem('mockWalletConnected') === 'true'
    setIsTestMode(testMode)
    setMockConnected(mockWallet)
  }, [])

  const address = isTestMode
    ? (mockConnected ? '0x1234...5678' : undefined)
    : realAddress
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    claims: true,
  })

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'lock' },
  ]

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
            Settings
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 px-3 xs:px-4">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary-light hover:bg-surface-light'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-primary-light">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary-light mb-2">
                        ENS Name
                      </label>
                      <input
                        type="text"
                        placeholder="yourname.eth"
                        className="w-full h-12 px-4 rounded-lg border border-gray-300 bg-white text-text-primary-light focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary-light mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text-primary-light focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-primary-light">Wallet Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary-light">Connected Wallet</p>
                        <p className="text-xs text-text-secondary-light mt-1 font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                      <button className="text-sm text-primary font-medium hover:underline">
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-primary-light">Notification Settings</h2>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-surface-light rounded-lg border border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-text-primary-light capitalize">{key}</p>
                          <p className="text-xs text-text-secondary-light mt-1">
                            {key === 'email' && 'Receive email notifications'}
                            {key === 'push' && 'Browser push notifications'}
                            {key === 'claims' && 'Get notified when your packets are claimed'}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications({ ...notifications, [key]: !value })
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            value ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/notifications"
                    className="inline-block text-sm text-primary font-medium hover:underline"
                  >
                    View Notification History →
                  </Link>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-primary-light">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Security settings coming soon. Your wallet connection is managed by your wallet provider.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

