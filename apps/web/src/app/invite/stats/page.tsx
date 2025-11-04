'use client'

import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function InviteStatsPage() {
  const stats = {
    totalInvites: 25,
    activeUsers: 18,
    totalRewards: '$50',
    totalSpent: '$1,250',
    conversionRate: '72%',
  }

  const recentInvites = [
    { address: '0xAb...cdef', date: '2024-11-01', status: 'active', reward: '$2' },
    { address: '0xCd...ef12', date: '2024-10-30', status: 'active', reward: '$2' },
    { address: '0xEf...1234', date: '2024-10-28', status: 'claimed', reward: '$2' },
  ]

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
              Invite Statistics
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light">
              Track your referral performance
            </p>
          </div>
          <Link
            href="/invite"
            className="text-sm text-primary font-medium hover:underline"
          >
            ← Back to Invite
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4 px-3 xs:px-4">
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-4 xs:p-6">
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Total Invites</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.totalInvites}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 xs:p-6">
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Active Users</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.activeUsers}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-4 xs:p-6 col-span-2 sm:col-span-1">
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Total Rewards</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.totalRewards}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-surface-light border border-gray-200 p-4 xs:p-6">
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Total Spent</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.totalSpent}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-surface-light border border-gray-200 p-4 xs:p-6">
            <p className="text-xs xs:text-sm text-text-secondary-light font-medium">Conversion Rate</p>
            <p className="text-2xl xs:text-3xl font-bold text-text-primary-light">{stats.conversionRate}</p>
          </div>
        </div>

        {/* Recent Invites */}
        <div className="px-3 xs:px-4">
          <h2 className="text-lg xs:text-xl font-bold text-text-primary-light mb-4">
            Recent Invites
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentInvites.map((invite, index) => (
                <div key={index} className="p-4 hover:bg-surface-light transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary-light">{invite.address}</p>
                      <p className="text-xs text-text-secondary-light mt-1">{invite.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invite.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {invite.status}
                      </span>
                      <p className="text-sm font-bold text-text-primary-light">{invite.reward}</p>
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

