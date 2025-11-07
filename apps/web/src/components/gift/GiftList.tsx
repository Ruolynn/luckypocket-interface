'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { GiftCard } from './GiftCard'
import type { Gift } from '@/lib/gift-types'
import { giftsAPI, APIError, NetworkError } from '@/lib/api/gifts'

interface GiftListProps {
  initialGifts?: Gift[]
}

export function GiftList({ initialGifts = [] }: GiftListProps) {
  const { address } = useAccount()
  const [gifts, setGifts] = useState<Gift[]>(initialGifts)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 12

  // Fetch gifts from API
  const fetchGifts = async (filterType: 'all' | 'sent' | 'received', loadMore = false) => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const currentOffset = loadMore ? offset : 0

      let result
      if (filterType === 'sent') {
        // Fetch sent gifts
        result = await giftsAPI.getGifts({
          senderId: address, // Note: This might need to be user ID, not address
          limit,
          offset: currentOffset,
          orderBy: 'createdAt',
          order: 'desc',
        })
      } else if (filterType === 'received') {
        // Fetch received gifts
        result = await giftsAPI.getUserReceivedGifts(address, {
          limit,
          offset: currentOffset,
          orderBy: 'createdAt',
          order: 'desc',
        })
      } else {
        // Fetch all gifts (both sent and received)
        result = await giftsAPI.getGifts({
          limit,
          offset: currentOffset,
          orderBy: 'createdAt',
          order: 'desc',
        })
      }

      if (loadMore) {
        setGifts([...gifts, ...result.gifts])
      } else {
        setGifts(result.gifts)
      }

      setHasMore(result.hasMore)
      setOffset(currentOffset + result.gifts.length)
    } catch (err) {
      console.error('Failed to fetch gifts:', err)
      if (err instanceof APIError) {
        setError(`Failed to load gifts: ${err.message}`)
      } else if (err instanceof NetworkError) {
        setError('Network error. Please check your connection.')
      } else {
        setError('Failed to load gifts. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch gifts on mount and when filter changes
  useEffect(() => {
    if (address) {
      setOffset(0)
      fetchGifts(filter, false)
    }
  }, [filter, address])

  // Load more gifts
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchGifts(filter, true)
    }
  }

  const filteredGifts = gifts

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="glass-card flex h-12 items-center justify-center rounded-lg p-1 bg-white/30">
        <button
          onClick={() => setFilter('all')}
          className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-3 gap-2 transition-all ${
            filter === 'all'
              ? 'glass-button-secondary shadow-sm text-text-primary-light'
              : 'text-text-secondary-light'
          }`}
        >
          <span className="material-symbols-outlined text-lg">card_giftcard</span>
          <span className="text-sm font-medium">All Gifts</span>
        </button>
        <button
          onClick={() => setFilter('sent')}
          className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-3 gap-2 transition-all ${
            filter === 'sent'
              ? 'glass-button-secondary shadow-sm text-text-primary-light'
              : 'text-text-secondary-light'
          }`}
        >
          <span className="material-symbols-outlined text-lg">send</span>
          <span className="text-sm font-medium">Sent</span>
        </button>
        <button
          onClick={() => setFilter('received')}
          className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-3 gap-2 transition-all ${
            filter === 'received'
              ? 'glass-button-secondary shadow-sm text-text-primary-light'
              : 'text-text-secondary-light'
          }`}
        >
          <span className="material-symbols-outlined text-lg">inbox</span>
          <span className="text-sm font-medium">Received</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card rounded-lg p-4 border border-red-300 bg-red-50/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600 flex-shrink-0">
              error
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => fetchGifts(filter, false)}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Gift List */}
      {loading && gifts.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              refresh
            </span>
            <p className="text-text-secondary-light">Loading gifts...</p>
          </div>
        </div>
      ) : filteredGifts.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="glass-button px-6 py-3 rounded-lg font-medium text-primary disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">expand_more</span>
                    Load More
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card rounded-lg border border-dashed border-white/30 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-5xl text-text-secondary-light">
              card_giftcard
            </span>
            <p className="text-lg font-bold text-text-primary-light">No gifts found</p>
            <p className="text-sm text-text-secondary-light max-w-md">
              {filter === 'sent'
                ? "You haven't sent any gifts yet. Create your first gift to get started!"
                : filter === 'received'
                  ? "You haven't received any gifts yet."
                  : 'No gifts to display.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
