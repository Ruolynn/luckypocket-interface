'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/MainLayout'
import { ClaimGift } from '@/components/gift/ClaimGift'
import { LoadingState } from '@/components/LoadingState'
import type { Gift } from '@/lib/gift-types'
import { giftsAPI, APIError, NetworkError } from '@/lib/api/gifts'

export default function GiftDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const giftId = params.id as string
  const showClaim = searchParams.get('action') === 'claim'

  const [gift, setGift] = useState<Gift | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (giftId) {
      fetchGiftDetails()
    }
  }, [giftId])

  const fetchGiftDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const giftData = await giftsAPI.getGift(giftId)
      setGift(giftData)
    } catch (err: any) {
      console.error('Failed to fetch gift details:', err)

      if (err instanceof APIError) {
        if (err.statusCode === 404) {
          setError('Gift not found')
        } else {
          setError(`Failed to load gift: ${err.message}`)
        }
      } else if (err instanceof NetworkError) {
        setError('Network error. Please check your connection.')
      } else {
        setError('Failed to load gift details. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingState message="Loading gift details..." />
      </MainLayout>
    )
  }

  if (error || !gift) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <span className="material-symbols-outlined text-6xl text-text-secondary-light">
            error
          </span>
          <h2 className="text-2xl font-bold text-text-primary-light">
            {error || 'Gift Not Found'}
          </h2>
          <p className="text-text-secondary-light max-w-md text-center">
            {error === 'Gift not found'
              ? "The gift you're looking for doesn't exist or has been removed."
              : "There was a problem loading the gift details. Please try again."}
          </p>
          <div className="flex gap-3">
            {error && error !== 'Gift not found' && (
              <button
                onClick={fetchGiftDetails}
                className="glass-button px-6 py-3 rounded-lg font-medium text-primary"
              >
                Try Again
              </button>
            )}
            <Link
              href="/gifts"
              className="glass-button-secondary px-6 py-3 rounded-lg font-medium text-text-primary-light"
            >
              View All Gifts
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const getThemeColors = () => {
    const themeMap: Record<string, { bg: string; accent: string }> = {
      default: {
        bg: 'from-red-500/20 to-red-300/20',
        accent: 'text-red-500',
      },
      blue: {
        bg: 'from-blue-500/20 to-blue-300/20',
        accent: 'text-blue-500',
      },
      purple: {
        bg: 'from-purple-500/20 to-purple-300/20',
        accent: 'text-purple-500',
      },
      gold: {
        bg: 'from-amber-500/20 to-yellow-300/20',
        accent: 'text-amber-500',
      },
      green: {
        bg: 'from-green-500/20 to-emerald-300/20',
        accent: 'text-green-500',
      },
      pink: {
        bg: 'from-pink-500/20 to-pink-300/20',
        accent: 'text-pink-500',
      },
    }

    return themeMap[gift?.theme || 'default'] || themeMap.default
  }

  const theme = getThemeColors()

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 xs:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <Link
            href="/gifts"
            className="size-10 rounded-full glass-button-secondary flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl xs:text-3xl font-black text-text-primary-light">
              Gift Details
            </h1>
            <p className="text-sm text-text-secondary-light">#{gift.giftId}</p>
          </div>
        </div>

        {/* Gift Card with Animation */}
        <div
          className={`glass-card rounded-2xl overflow-hidden bg-gradient-to-br ${theme.bg}`}
        >
          <div className="p-6 xs:p-8">
            {/* Gift Icon */}
            <div className="flex justify-center mb-6">
              <div className={`size-24 rounded-full bg-white/90 flex items-center justify-center ${theme.accent}`}>
                <span className="material-symbols-outlined text-5xl">
                  card_giftcard
                </span>
              </div>
            </div>

            {/* Gift Message */}
            <div className="text-center mb-6">
              <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light mb-3">
                {gift.message || 'A Special Gift for You'}
              </h2>
              <p className="text-sm text-text-secondary-light">
                From{' '}
                <span className="font-medium">
                  {gift.creator.address.slice(0, 6)}...{gift.creator.address.slice(-4)}
                </span>
              </p>
            </div>

            {/* Gift Amount */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-text-secondary-light mb-2">You will receive</p>
                <p className="text-3xl xs:text-4xl font-black text-text-primary-light">
                  {gift.giftType === 'NFT'
                    ? `NFT #${gift.amount}`
                    : `${parseFloat(gift.amount) / Math.pow(10, gift.tokenDecimals || 18)} ${gift.tokenSymbol || 'TOKEN'}`
                  }
                </p>
                {gift.giftType === 'TOKEN' && gift.tokenSymbol && (
                  <p className="text-sm text-text-secondary-light mt-2">
                    {gift.tokenSymbol}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary-light">Type</span>
                <span className="font-medium text-text-primary-light">
                  {gift.giftType === 'NFT' ? 'NFT Gift' : 'Token Gift'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary-light">Status</span>
                <span className="font-medium text-text-primary-light">
                  {gift.claimed ? 'Claimed' : 'Unclaimed'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary-light">Expires</span>
                <span className="font-medium text-text-primary-light">
                  {new Date(gift.expireTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Section */}
        {showClaim && (
          <ClaimGift
            gift={gift}
            onSuccess={() => {
              // Refresh gift details after successful claim
              fetchGiftDetails()
            }}
          />
        )}

        {/* Transaction Info */}
        {gift.txHash && (
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm font-medium text-text-primary-light mb-2">
              Transaction Hash
            </p>
            <a
              href={`https://basescan.org/tx/${gift.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono break-all"
            >
              {gift.txHash}
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
