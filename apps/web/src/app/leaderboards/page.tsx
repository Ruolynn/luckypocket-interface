'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/MainLayout'
import { apiClient } from '@/lib/api'
import type { LeaderboardEntry } from '@/lib/types'

type BoardType = 'luck' | 'generous' | 'active' | 'channel'
type TimeFilter = '24h' | '7d' | '30d' | 'all'

export default function LeaderboardsPage() {
  const [boardType, setBoardType] = useState<BoardType>('luck')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d')
  const [search, setSearch] = useState('')

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard', boardType, timeFilter],
    queryFn: () => apiClient.getLeaderboard(boardType, timeFilter),
    staleTime: 30 * 1000, // 30 seconds
  })

  const leaders: LeaderboardEntry[] = leaderboardData?.top || []

  const boardTypes = [
    { id: 'luck' as const, label: 'Luckiest', icon: 'trending_up' },
    { id: 'generous' as const, label: 'Most Generous', icon: 'favorite' },
    { id: 'active' as const, label: 'Most Active', icon: 'local_fire_department' },
    { id: 'channel' as const, label: 'Channel Leaderboard', icon: 'groups' },
  ]

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown'
    // Check if it's an ENS name (contains .eth or .xyz, etc.)
    if (addr.includes('.')) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format score based on board type
  const formatScore = (score: string, type: BoardType) => {
    const num = parseFloat(score)
    if (type === 'luck' || type === 'generous') {
      // For luck and generous, score is in wei (assuming 18 decimals for ETH)
      // For USDC, it would be 6 decimals, but we'll assume ETH for now
      const eth = num / 1e18
      if (eth >= 1) {
        return `${eth.toFixed(2)} ETH`
      } else {
        return `${(eth * 1000).toFixed(2)} mETH`
      }
    } else if (type === 'active') {
      // For active, score is count
      return `${Math.floor(num)} claims`
    } else {
      // For channel, score might be different
      return `${Math.floor(num)}`
    }
  }

  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' },
  ]

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
              Leaderboards
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light">
              See who's the luckiest and most generous
            </p>
          </div>
        </div>

        {/* Board Type Tabs */}
        <div className="px-3 xs:px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {boardTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setBoardType(type.id)}
                className={`flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 rounded-lg font-medium text-sm xs:text-base transition-colors touch-manipulation whitespace-nowrap ${
                  boardType === type.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-light text-text-secondary-light hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg xs:text-xl">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 px-3 xs:px-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by address or ENS"
              className="h-10 xs:h-11 w-full rounded-lg border border-gray-200 bg-surface-light pl-10 pr-4 text-sm text-text-primary-light placeholder:text-text-secondary-light focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`h-10 xs:h-11 px-4 rounded-lg text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                  timeFilter === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-light border border-gray-200 text-text-secondary-light hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-3 xs:px-4">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-secondary-light">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-red-500 mb-4">Failed to load leaderboard</p>
              <button
                onClick={() => window.location.reload()}
                className="glass-button px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : leaders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-text-secondary-light">No data available yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {leaders
                  .filter((leader) => {
                    if (!search) return true
                    const searchLower = search.toLowerCase()
                    return (
                      leader.address.toLowerCase().includes(searchLower) ||
                      leader.farcasterName?.toLowerCase().includes(searchLower) ||
                      false
                    )
                  })
                  .map((leader) => (
                    <div
                      key={leader.userId}
                      className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 hover:bg-surface-light transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 xs:w-10 h-8 xs:h-10 rounded-full shrink-0">
                        <span className="text-lg xs:text-xl font-bold text-text-primary-light">
                          {getMedal(leader.rank)}
                        </span>
                      </div>
                      <div className="w-10 xs:w-12 h-10 xs:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg xs:text-xl">
                          account_circle
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm xs:text-base font-bold text-text-primary-light truncate">
                          {leader.farcasterName || formatAddress(leader.address)}
                        </p>
                        <p className="text-xs text-text-secondary-light truncate">
                          {leader.farcasterName ? formatAddress(leader.address) : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm xs:text-base font-bold text-text-primary-light">
                          {formatScore(leader.score, boardType)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Channel Leaderboard Info */}
        {boardType === 'channel' && (
          <div className="px-3 xs:px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Channel Leaderboard
                  </p>
                  <p className="text-xs text-blue-700">
                    This leaderboard shows the most active channels (Farcaster channels) based on gift activity.
                    Channel rankings are calculated based on the number of gifts created and claimed within each channel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

