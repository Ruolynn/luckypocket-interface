'use client'

import { MainLayout } from '@/components/MainLayout'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  total?: number
  category: 'packet' | 'claim' | 'social' | 'special'
}

export default function AchievementsPage() {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Packet',
      description: 'Send your first lucky packet',
      icon: 'redeem',
      unlocked: true,
      category: 'packet',
    },
    {
      id: '2',
      title: 'Lucky Streak',
      description: 'Claim 10 packets in a row',
      icon: 'local_fire_department',
      unlocked: false,
      progress: 7,
      total: 10,
      category: 'claim',
    },
    {
      id: '3',
      title: 'Generous Giver',
      description: 'Send 50 packets',
      icon: 'favorite',
      unlocked: false,
      progress: 23,
      total: 50,
      category: 'packet',
    },
    {
      id: '4',
      title: 'Social Butterfly',
      description: 'Invite 10 friends',
      icon: 'group',
      unlocked: true,
      progress: 10,
      total: 10,
      category: 'social',
    },
    {
      id: '5',
      title: 'Lucky Winner',
      description: 'Win the largest amount in a packet',
      icon: 'stars',
      unlocked: false,
      category: 'special',
    },
  ]

  const categories = [
    { id: 'all', label: 'All', icon: 'workspace_premium' },
    { id: 'packet', label: 'Packets', icon: 'redeem' },
    { id: 'claim', label: 'Claims', icon: 'card_giftcard' },
    { id: 'social', label: 'Social', icon: 'group' },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'packet':
        return 'bg-blue-500/10 text-blue-600'
      case 'claim':
        return 'bg-green-500/10 text-green-600'
      case 'social':
        return 'bg-purple-500/10 text-purple-600'
      case 'special':
        return 'bg-yellow-500/10 text-yellow-600'
      default:
        return 'bg-gray-500/10 text-gray-600'
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
              Achievements
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light">
              {unlockedCount} of {totalCount} achievements unlocked
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 xs:px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary-light">Overall Progress</span>
              <span className="text-sm font-bold text-text-primary-light">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-3 xs:px-4">
          {categories.map((category) => (
            <button
              key={category.id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light border border-gray-200 text-sm font-medium text-text-secondary-light hover:bg-gray-100 transition-colors touch-manipulation whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="px-3 xs:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-white rounded-xl border-2 p-4 xs:p-6 transition-all ${
                  achievement.unlocked
                    ? 'border-primary shadow-lg'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center rounded-lg size-14 xs:size-16 shrink-0 ${
                      achievement.unlocked
                        ? getCategoryColor(achievement.category)
                        : 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl xs:text-4xl">
                      {achievement.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base xs:text-lg font-bold text-text-primary-light">
                        {achievement.title}
                      </h3>
                      {achievement.unlocked && (
                        <span className="text-yellow-600">
                          <span className="material-symbols-outlined text-xl">stars</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs xs:text-sm text-text-secondary-light mt-1">
                      {achievement.description}
                    </p>
                    {achievement.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-text-secondary-light mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{
                              width: `${(achievement.progress / (achievement.total || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

