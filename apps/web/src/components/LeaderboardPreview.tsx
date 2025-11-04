import Link from 'next/link'

const leaders = [
  {
    rank: 1,
    name: 'vitalik.eth',
    maxClaim: '2.5 ETH',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxGJzQsN_ZBFBL-UAChcD9nSKiRLFjqfPmLAnr2sqZk1bULl7APmlKtj-CPXX9J0MeujXagGRXhr8hwNnRUe2_zrUYN78ji4jcVjU7_ZzF68AEmLCKPJQckUtvTWPl2l6xEtN46df7msTj6LvPpe_c1-9mTK8yezZCVS1Q1ljTZpK48vVVv2eJEywm6sXLtofC6nKzTpMqskBG_523RyaqLOzRfDeLpHLzslrfkkjv_bEokpjYi9wK7SHnEZALbiDiQjF5kXxIRSnY',
    medal: '🥇',
    bgClass: 'bg-yellow-500/10',
    iconClass: 'text-yellow-600',
  },
  {
    rank: 2,
    name: 'dwr.eth',
    maxClaim: '1.8 ETH',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDKj2dCVtbRvC6iffSsg0hc0hjXgEo-rQuI1NIeLz1Ztw8rK7AAUEU-QjyyCjj1TPsfXTs4ResreBHUCccTKo2ClCySp70LgQa2yiRdwWioiXXwqBOACYNJNxUKOrA_epeJpU3Oanye3EaZjnnr8PMMqqNTgagBWHVHuY6dAhQtWHtArSMtmRHeX0dZP_1yOXq4doUadHPmWgXKMGeHLOycfxTnQ9tvEUW_9H_PdqgE0OD2wkZs7gaQbCGd_z3moOMpQK1xUc1ZTNPb',
    medal: '🥈',
    bgClass: 'bg-gray-500/10',
    iconClass: 'text-gray-500',
  },
  {
    rank: 3,
    name: 'gmoney.eth',
    maxClaim: '1.2 ETH',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBZTkcRuRkNZsOm7MDSTtLOuLyQ860wC4NlLsl07CzrY-C9UzYXpU-v37NLugP_QHyY0c3i8ORarDmw0kKcGmNbmJGDrjubF3cfBo_89xoI2nqLMjUmSb-zIWfhb0kGX45Dihyf0k7LZN0PVI2QVONVyo1XlIE52O8-0njOYBpJ6ladZzg5fwR-U3icDzxf8NqkILEtIgJDxE0ASefeixelu4Pu1LAQJyC3_t7bYylqN6-scxXVm8MMoadwzew3C0yFS2LzyMcZbDm5',
    medal: '🥉',
    bgClass: 'bg-yellow-700/10',
    iconClass: 'text-yellow-700',
  },
]

export function LeaderboardPreview() {
  return (
    <div className="px-3 xs:px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light">
          This Week's Luckiest
        </h2>
        <Link
          href="/leaderboards"
          className="text-sm xs:text-base text-primary hover:underline font-medium"
        >
          View Full Leaderboard
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {leaders.map((leader) => (
            <div
              key={leader.rank}
              className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 hover:bg-surface-light transition-colors"
            >
              <div
                className={`flex items-center justify-center w-8 xs:w-10 h-8 xs:h-10 rounded-full shrink-0 ${leader.bgClass}`}
              >
                <span className={`material-symbols-outlined ${leader.iconClass} text-lg xs:text-xl`}>
                  military_tech
                </span>
              </div>
              <img
                className="w-10 xs:w-12 h-10 xs:h-12 rounded-full shrink-0"
                alt={leader.name}
                src={leader.avatar}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm xs:text-base font-bold text-text-primary-light truncate">
                  {leader.name}
                </p>
                <p className="text-xs text-text-secondary-light">Max claim: {leader.maxClaim}</p>
              </div>
              <div className="text-right">
                <p className="text-sm xs:text-base font-bold text-text-primary-light">
                  {leader.medal} #{leader.rank}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

