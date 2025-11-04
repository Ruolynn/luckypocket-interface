import Link from 'next/link'

interface PacketCardProps {
  title: string
  description: string
  amount: string
  claimed: number
  total: number
  status: 'active' | 'claimed'
  packetId?: string
}

export function PacketCard({
  title,
  description,
  amount,
  claimed,
  total,
  status,
  packetId = '#',
}: PacketCardProps) {
  const isClaimed = status === 'claimed'

  return (
    <div
      className={`glass-card flex flex-col sm:flex-row gap-3 xs:gap-4 rounded-xl px-4 xs:px-6 py-4 transition-all ${
        isClaimed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 xs:gap-4 flex-1 min-w-0">
        <div
          className={`material-symbols-outlined flex items-center justify-center rounded-lg shrink-0 size-12 xs:size-14 text-2xl xs:text-3xl ${
            isClaimed
              ? 'text-gray-400 bg-gray-500/10'
              : title.includes('Congratulations')
                ? 'text-green-400 bg-green-500/10'
                : 'text-accent bg-accent/20'
          }`}
        >
          {title.includes('Congratulations') ? 'card_giftcard' : 'redeem'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base xs:text-lg font-bold text-text-primary-light truncate mb-1">
            {title}
          </p>
          <p className="text-xs xs:text-sm text-text-secondary-light line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-3 xs:gap-4 mt-2 text-xs xs:text-sm text-text-secondary-light">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">attach_money</span>
              <span>{amount}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">group</span>
              <span>
                {isClaimed ? 'All claimed' : `${claimed}/${total} claimed`}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 sm:flex-col">
        {isClaimed ? (
          <button
            disabled
            className="flex items-center justify-center rounded-lg h-10 xs:h-11 px-4 bg-gray-100 text-sm xs:text-base font-medium text-gray-400 cursor-not-allowed whitespace-nowrap"
          >
            All Claimed
          </button>
        ) : (
          <Link
            href={`/packet/${packetId}`}
            className="glass-button flex items-center justify-center rounded-lg h-10 xs:h-11 px-4 text-sm xs:text-base font-medium text-primary touch-manipulation whitespace-nowrap"
          >
            <span>Claim</span>
          </Link>
        )}
        <Link
          href={`/packet/${packetId}`}
          className="glass-button-secondary flex items-center justify-center rounded-lg h-10 xs:h-11 px-4 text-sm xs:text-base font-medium text-text-secondary-light touch-manipulation whitespace-nowrap"
        >
          <span>Details</span>
        </Link>
      </div>
    </div>
  )
}

