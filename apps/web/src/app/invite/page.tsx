'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function InvitePage() {
  const [inviteCode] = useState('LP2024XYZ')
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/invite?code=${inviteCode}`)
    }
  }, [inviteCode])
  const inviteStats = {
    totalInvites: 10,
    activeInvites: 7,
    totalRewards: '$20',
    pendingRewards: '$5',
  }

  const inviteList = [
    { address: '0xAb...cdef', joined: '2 days ago', reward: '$2', status: 'active' },
    { address: '0xCd...ef12', joined: '5 days ago', reward: '$2', status: 'active' },
    { address: '0xEf...1234', joined: '1 week ago', reward: '$2', status: 'active' },
  ]

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
              Invite Friends
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light">
              Invite friends and earn $2 USDC per invite
            </p>
          </div>
          <Link
            href="/invite/stats"
            className="text-sm text-primary font-medium hover:underline"
          >
            View Stats →
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 xs:gap-4 px-3 xs:px-4">
          <div className="glass-card flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 xs:p-6 transition-all">
            <div className="flex items-center justify-center w-10 xs:w-12 h-10 xs:h-12 rounded-full mb-2 text-blue-600 bg-blue-500/10">
              <span className="material-symbols-outlined text-xl xs:text-2xl">group_add</span>
            </div>
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Total Invites</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">
              {inviteStats.totalInvites}
            </p>
          </div>
          <div className="glass-card flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 p-4 xs:p-6 transition-all">
            <div className="flex items-center justify-center w-10 xs:w-12 h-10 xs:h-12 rounded-full mb-2 text-green-600 bg-green-500/10">
              <span className="material-symbols-outlined text-xl xs:text-2xl">card_giftcard</span>
            </div>
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Total Rewards</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">
              {inviteStats.totalRewards}
            </p>
          </div>
        </div>

        {/* Invite Code Section */}
        <div className="px-3 xs:px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <h2 className="text-lg xs:text-xl font-bold text-text-primary-light mb-4">
              Your Invite Code
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-surface-light border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs text-text-secondary-light mb-1">Invite Code</p>
                <p className="text-lg font-bold text-text-primary-light font-mono">{inviteCode}</p>
              </div>
              <button
                onClick={copyInviteLink}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors touch-manipulation"
              >
                <span className="material-symbols-outlined text-primary">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>

            <div className="bg-surface-light border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-text-secondary-light mb-2">Invite Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary-light font-mono"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-surface-light border border-gray-200 rounded-lg p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-text-secondary-light mb-2">
                qr_code
              </span>
              <p className="text-sm text-text-secondary-light">QR Code (requires library integration)</p>
            </div>
          </div>
        </div>

        {/* Pending Rewards */}
        {inviteStats.pendingRewards !== '$0' && (
          <div className="px-3 xs:px-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">Pending Rewards</p>
                <p className="text-lg font-bold text-yellow-900 mt-1">{inviteStats.pendingRewards} USDC</p>
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors touch-manipulation">
                Claim
              </button>
            </div>
          </div>
        )}

        {/* Invite List */}
        <div className="px-3 xs:px-4">
          <h2 className="text-lg xs:text-xl font-bold text-text-primary-light mb-4">
            Invite History
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {inviteList.map((invite, index) => (
                <div key={index} className="p-4 hover:bg-surface-light transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary-light">{invite.address}</p>
                      <p className="text-xs text-text-secondary-light mt-1">Joined {invite.joined}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary-light">{invite.reward}</p>
                      <p className="text-xs text-text-secondary-light">Reward earned</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

