'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/MainLayout'

type BoardType = 'luckiest' | 'generous' | 'active' | 'channel'
type TimeFilter = '24h' | '7d' | '30d' | 'all'

interface Leader {
  rank: number
  address: string
  avatar: string
  value: string
  maxClaim?: string
}

export default function LeaderboardsPage() {
  const [boardType, setBoardType] = useState<BoardType>('luckiest')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d')
  const [search, setSearch] = useState('')

  const leaders: Leader[] = [
    { rank: 1, address: 'vitalik.eth', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxGJzQsN_ZBFBL-UAChcD9nSKiRLFjqfPmLAnr2sqZk1bULl7APmlKtj-CPXX9J0MeujXagGRXhr8hwNnRUe2_zrUYN78ji4jcVjU7_ZzF68AEmLCKPJQckUtvTWPl2l6xEtN46df7msTj6LvPpe_c1-9mTK8yezZCVS1Q1ljTZpK48vVVv2eJEywm6sXLtofC6nKzTpMqskBG_523RyaqLOzRfDeLpHLzslrfkkjv_bEokpjYi9wK7SHnEZALbiDiQjF5kXxIRSnY', value: '2.5 ETH', maxClaim: '2.5 ETH' },
    { rank: 2, address: 'dwr.eth', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKj2dCVtbRvC6iffSsg0hc0hjXgEo-rQuI1NIeLz1Ztw8rK7AAUEU-QjyyCjj1TPsfXTs4ResreBHUCccTKo2ClCySp70LgQa2yiRdwWioiXXwqBOACYNJNxUKOrA_epeJpU3Oanye3EaZjnnr8PMMqqNTgagBWHVHuY6dAhQtWHtArSMtmRHeX0dZP_1yOXq4doUadHPmWgXKMGeHLOycfxTnQ9tvEUW_9H_PdqgE0OD2wkZs7gaQbCGd_z3moOMpQK1xUc1ZTNPb', value: '1.8 ETH', maxClaim: '1.8 ETH' },
    { rank: 3, address: 'gmoney.eth', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZTkcRuRkNZsOm7MDSTtLOuLyQ860wC4NlLsl07CzrY-C9UzYXpU-v37NLugP_QHyY0c3i8ORarDmw0kKcGmNbmJGDrjubF3cfBo_89xoI2nqLMjUmSb-zIWfhb0kGX45Dihyf0k7LZN0PVI2QVONVyo1XlIE52O8-0njOYBpJ6ladZzg5fwR-U3icDzxf8NqkILEtIgJDxE0ASefeixelu4Pu1LAQJyC3_t7bYylqN6-scxXVm8MMoadwzew3C0yFS2LzyMcZbDm5', value: '1.2 ETH', maxClaim: '1.2 ETH' },
  ]

  const boardTypes = [
    { id: 'luckiest' as const, label: 'Luckiest', icon: 'trending_up' },
    { id: 'generous' as const, label: 'Most Generous', icon: 'favorite' },
    { id: 'active' as const, label: 'Most Active', icon: 'local_fire_department' },
    { id: 'channel' as const, label: 'Channel Leaderboard', icon: 'groups' },
  ]

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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {leaders.map((leader) => (
                <div
                  key={leader.rank}
                  className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center justify-center w-8 xs:w-10 h-8 xs:h-10 rounded-full shrink-0">
                    <span className="text-lg xs:text-xl font-bold text-text-primary-light">
                      {getMedal(leader.rank)}
                    </span>
                  </div>
                  <img
                    className="w-10 xs:w-12 h-10 xs:h-12 rounded-full shrink-0"
                    alt={leader.address}
                    src={leader.avatar}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm xs:text-base font-bold text-text-primary-light truncate">
                      {leader.address}
                    </p>
                    {leader.maxClaim && (
                      <p className="text-xs text-text-secondary-light">Max claim: {leader.maxClaim}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm xs:text-base font-bold text-text-primary-light">{leader.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channel Leaderboard (P1 - when channel tab selected) */}
        {boardType === 'channel' && (
          <div className="px-3 xs:px-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800 font-medium">
                Channel leaderboard coming soon! Check back later.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

