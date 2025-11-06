'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MainLayout } from '@/components/MainLayout'
import { useParams } from 'next/navigation'
import { useGift } from '@/hooks/useGift'
import { useGiftSocket } from '@/hooks/useGiftSocket'
import { toast } from 'sonner'

interface ClaimRecord {
  id: string
  claimer: {
    address: string
    farcasterName?: string
  }
  amount: string
  claimedAt: string
  txHash: string
  isBest?: boolean
}

export default function PacketDetailPage() {
  const { id } = useParams()
  const giftId = id as string
  const { address } = useAccount()
  const { data: gift, isLoading, error, refetch } = useGift(giftId)
  
  // Socket.IO for real-time updates
  useGiftSocket(address)

  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  // Check if user has already claimed
  const hasClaimed = useMemo(() => {
    if (!gift || !address) return false
    return gift.claims?.some((claim: any) => 
      claim.claimer?.address?.toLowerCase() === address.toLowerCase()
    ) || false
  }, [gift, address])

  // Calculate time left until expiry
  const timeLeft = useMemo(() => {
    if (!gift?.expiresAt) return { hours: 0, minutes: 0, seconds: 0 }
    
    const now = Date.now()
    const expiry = new Date(gift.expiresAt).getTime()
    const diff = Math.max(0, expiry - now)
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return { hours, minutes, seconds }
  }, [gift?.expiresAt])

  // Update countdown timer
  useEffect(() => {
    if (!gift?.expiresAt) return
    
    const timer = setInterval(() => {
      // Force re-render by updating a state (timeLeft is computed, so we use a dummy state)
      // Actually, timeLeft is computed from gift.expiresAt, so it will update automatically
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gift?.expiresAt])

  // Format amount with token symbol
  const formatAmount = (amount: string, decimals?: number, symbol?: string) => {
    const dec = decimals || 18
    const num = BigInt(amount) / BigInt(10 ** dec)
    const formatted = Number(num) / (10 ** (dec > 6 ? dec - 6 : 0))
    return `${formatted.toLocaleString()} ${symbol || 'ETH'}`
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = Date.now()
    const then = new Date(date).getTime()
    const diff = now - then
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  // Handle claim
  const handleClaim = async () => {
    if (!address || !gift) return
    
    try {
      setIsClaiming(true)
      
      // Use proxy claim endpoint
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
      
      const response = await fetch(`${API_BASE_URL}/api/v1/gifts/${giftId}/claim-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success && result.txHash) {
        setClaimed(true)
        toast.success('Gift claimed successfully!')
        refetch()
      } else if (result.message) {
        // Need to sign message
        toast.info('Please sign the message to claim')
        // TODO: Show signing UI
      } else {
        throw new Error(result.message || 'Failed to claim gift')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim gift')
    } finally {
      setIsClaiming(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary-light">Loading gift details...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Error state
  if (error || !gift) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load gift</p>
            <button
              onClick={() => refetch()}
              className="glass-button px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const isExpired = new Date(gift.expiresAt) < new Date()
  const canClaim = !hasClaimed && !isExpired && gift.status === 'PENDING' && address
  const claims: ClaimRecord[] = gift.claims || []
  
  // Find best claim (highest amount) - for gifts, this might not apply, but we'll show it if available
  const bestClaim = claims.length > 0 
    ? claims.reduce((best, claim) => {
        const bestAmount = BigInt(best.amount || '0')
        const claimAmount = BigInt(claim.amount || '0')
        return claimAmount > bestAmount ? claim : best
      })
    : null

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-6 xs:py-8 sm:py-10 px-2 xs:px-0">
        <div className="w-full max-w-md mx-auto">
          <div className="glass-card p-4 xs:p-6 sm:p-8 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-4 xs:mb-6">
              <div className="flex items-center gap-2 mb-3 xs:mb-4">
                <div className="w-7 xs:w-8 h-7 xs:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">account_circle</span>
                </div>
                <p className="text-xs xs:text-sm text-text-secondary-light">
                  A gift from <span className="font-bold text-text-primary-light">
                    {gift.sender?.farcasterName || formatAddress(gift.sender?.address || '')}
                  </span>
                </p>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-text-primary-light mb-3 xs:mb-4 px-2">
                {gift.message || 'Congratulations!'}
              </h1>
              {gift.message && (
                <p className="text-xs xs:text-sm text-text-secondary-light mb-4 xs:mb-6 px-2">
                  {gift.message}
                </p>
              )}
            </div>

            {/* Packet Icon */}
            <div className="relative w-20 xs:w-24 h-20 xs:h-24 mx-auto mb-4 xs:mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
              <div className="absolute inset-2 bg-primary/20 rounded-full"></div>
              <span className="material-symbols-outlined text-primary text-5xl xs:text-6xl absolute inset-0 flex items-center justify-center">
                redeem
              </span>
            </div>

            {/* Amount Card */}
            <div className="w-full bg-gray-100 p-3 xs:p-4 rounded-lg mb-4 xs:mb-6">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-baseline gap-2 xs:gap-0 mb-2">
                <span className="text-xs xs:text-sm text-text-secondary-light">Total Amount</span>
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                  {gift.tokenType}
                </span>
              </div>
              <p className="text-2xl xs:text-3xl font-extrabold text-text-primary-light">
                {formatAmount(gift.amount, gift.tokenDecimals, gift.tokenSymbol)}
              </p>
              {gift.status === 'CLAIMED' && gift.claimedAt && (
                <p className="text-xs text-text-secondary-light mt-1">
                  Claimed {formatTimeAgo(gift.claimedAt)}
                </p>
              )}
            </div>

            {/* Countdown */}
            <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 xs:p-4 mb-4 xs:mb-6 text-center">
              <div className="flex items-center justify-center gap-1 xs:gap-2 text-yellow-600 mb-2">
                <span className="material-symbols-outlined text-base xs:text-lg">timer</span>
                <p className="text-xs xs:text-sm font-medium">Expires in</p>
              </div>
              <div className="flex justify-center items-end gap-1 xs:gap-2 text-yellow-800">
                <div className="text-center">
                  <span className="text-2xl xs:text-3xl font-bold leading-none">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-xs block">Hours</span>
                </div>
                <span className="text-2xl xs:text-3xl font-bold leading-none">:</span>
                <div className="text-center">
                  <span className="text-2xl xs:text-3xl font-bold leading-none">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs block">Minutes</span>
                </div>
                <span className="text-2xl xs:text-3xl font-bold leading-none">:</span>
                <div className="text-center">
                  <span className="text-2xl xs:text-3xl font-bold leading-none">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs block">Seconds</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="w-full mb-4 xs:mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  gift.status === 'CLAIMED' ? 'bg-green-100 text-green-700' :
                  gift.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' :
                  gift.status === 'REFUNDED' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {gift.status}
                </span>
                {claims.length > 0 && (
                  <span className="text-xs text-text-secondary-light">
                    {claims.length} claim{claims.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Claim Button */}
            {hasClaimed || gift.status === 'CLAIMED' ? (
              <div className="glass-card w-full bg-green-50/50 rounded-lg p-4 text-center border border-green-200/50">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <p className="text-sm font-medium">Successfully Claimed!</p>
                </div>
                {hasClaimed && (() => {
                  const userClaim = claims.find((c: any) => 
                    c.claimer?.address?.toLowerCase() === address?.toLowerCase()
                  )
                  return userClaim && (
                    <p className="text-xs text-green-600">
                      You received {formatAmount(userClaim.amount, gift.tokenDecimals, gift.tokenSymbol)}
                    </p>
                  )
                })()}
              </div>
            ) : !address ? (
              <div className="w-full">
                <ConnectButton />
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={isClaiming || !canClaim}
                className="glass-button w-full text-primary font-bold py-3 xs:py-3.5 px-4 xs:px-6 rounded-lg text-base xs:text-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative z-10">
                  {isClaiming ? 'Claiming...' : 
                   isExpired ? 'Expired' :
                   gift.status !== 'PENDING' ? gift.status :
                   'Claim Now'}
                </span>
              </button>
            )}

            {/* Claim History */}
            {claims.length > 0 && (
              <div className="mt-6 xs:mt-8">
                <h2 className="text-base xs:text-lg font-semibold text-text-primary-light mb-3 xs:mb-4 text-center">
                  Claim History
                </h2>
                <div className="space-y-3 xs:space-y-4 max-h-48 xs:max-h-60 overflow-y-auto pr-1 xs:pr-2">
                  {claims.map((claim: ClaimRecord) => {
                    const isBest = bestClaim?.id === claim.id && claims.length > 1
                    const claimerName = claim.claimer?.farcasterName || formatAddress(claim.claimer?.address || '')
                    
                    return (
                      <div
                        key={claim.id}
                        className="glass-card flex items-start justify-between p-2 xs:p-3 rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                          <div className="w-8 xs:w-10 h-8 xs:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-sm">account_circle</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs xs:text-sm font-medium text-text-primary-light truncate block">
                              {claimerName}
                              {isBest && (
                                <span className="ml-2 text-yellow-600 inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">star</span>
                                  <span className="text-xs">Best!</span>
                                </span>
                              )}
                            </span>
                            <p className="text-xs text-text-secondary-light">
                              {formatTimeAgo(claim.claimedAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs xs:text-sm font-bold text-text-primary-light whitespace-nowrap flex-shrink-0">
                          {formatAmount(claim.amount, gift.tokenDecimals, gift.tokenSymbol)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

