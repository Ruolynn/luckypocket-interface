'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import type { Gift } from '@/lib/gift-types'
import { giftsAPI, APIError, NetworkError } from '@/lib/api/gifts'
import { useClaimGift } from '@/lib/contracts/gift'

interface ClaimGiftProps {
  gift: Gift
  onSuccess?: () => void
}

export function ClaimGift({ gift, onSuccess }: ClaimGiftProps) {
  const { isConnected, address } = useAccount()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(gift.claimed)
  const [error, setError] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState<boolean | null>(null)
  const [claimReason, setClaimReason] = useState<string | null>(null)

  const isClaimed = claimed || gift.claimed
  const isExpired = new Date(gift.expireTime) < new Date()
  const isRecipient = address?.toLowerCase() === gift.recipient.toLowerCase()

  // Check if user can claim
  useEffect(() => {
    if (isConnected && isRecipient && !isClaimed && !isExpired) {
      checkCanClaim()
    }
  }, [isConnected, isRecipient, gift.giftId])

  const checkCanClaim = async () => {
    try {
      const result = await giftsAPI.canClaim(gift.giftId)
      setCanClaim(result.canClaim)
      setClaimReason(result.reason || null)
    } catch (err) {
      console.error('Failed to check claim eligibility:', err)
      setCanClaim(true) // Allow attempt if check fails
    }
  }

  // Smart contract hook for claiming
  const {
    claimGiftAsync,
    isLoading: isClaimingContract,
    txHash,
  } = useClaimGift(BigInt(gift.giftId || 0), isConnected && isRecipient)

  const handleClaim = async () => {
    if (!isConnected || !isRecipient || isClaimed || isExpired) return
    if (canClaim === false) {
      setError(claimReason || 'Cannot claim this gift')
      return
    }

    setClaiming(true)
    setError(null)

    try {
      // Step 1: Call smart contract to claim
      const tx = await claimGiftAsync?.()

      if (!tx?.hash) {
        throw new Error('Transaction failed')
      }

      // Step 2: Record claim in backend
      await giftsAPI.recordClaim(gift.giftId, {
        txHash: tx.hash,
      })

      setClaimed(true)
      onSuccess?.()
    } catch (err: any) {
      console.error('Failed to claim gift:', err)

      if (err instanceof APIError) {
        setError(`API Error: ${err.message}`)
      } else if (err instanceof NetworkError) {
        setError('Network error. Please check your connection.')
      } else if (err?.message?.includes('user rejected')) {
        setError('Transaction was rejected')
      } else {
        setError(err?.message || 'Failed to claim gift. Please try again.')
      }
    } finally {
      setClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">
              account_balance_wallet
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary-light mb-2">
              Connect Your Wallet
            </p>
            <p className="text-sm text-text-secondary-light mb-4">
              Please connect your wallet to claim this gift
            </p>
          </div>
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (!isRecipient) {
    return (
      <div className="glass-card rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 p-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-yellow-600">
            warning
          </span>
          <div>
            <p className="font-bold text-text-primary-light mb-1">Not Your Gift</p>
            <p className="text-sm text-text-secondary-light">
              This gift is intended for{' '}
              <span className="font-mono">
                {gift.recipient.slice(0, 6)}...{gift.recipient.slice(-4)}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isClaimed) {
    return (
      <div className="glass-card rounded-lg border-2 border-green-500/30 bg-green-500/5 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-green-600">
              check_circle
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary-light mb-1">
              Gift Claimed!
            </p>
            <p className="text-sm text-text-secondary-light">
              This gift has been successfully claimed
            </p>
            {gift.claimedAt && (
              <p className="text-xs text-text-secondary-light mt-2">
                Claimed on {new Date(gift.claimedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="glass-card rounded-lg border-2 border-gray-500/30 bg-gray-500/5 p-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-gray-600">
            schedule
          </span>
          <div>
            <p className="font-bold text-text-primary-light mb-1">Gift Expired</p>
            <p className="text-sm text-text-secondary-light">
              This gift expired on {new Date(gift.expireTime).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-lg p-6">
      <div className="space-y-4">
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
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {claiming && txHash && (
          <div className="glass-card rounded-lg p-4 border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary animate-spin">
                refresh
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary-light mb-1">
                  Processing Claim...
                </p>
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View Transaction →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Claim Eligibility Warning */}
        {canClaim === false && claimReason && (
          <div className="glass-card rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600 flex-shrink-0">
                warning
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary-light mb-1">
                  Cannot Claim
                </p>
                <p className="text-xs text-text-secondary-light">{claimReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-bold text-text-primary-light mb-2">
            Ready to Claim Your Gift?
          </p>
          <p className="text-sm text-text-secondary-light">
            Click the button below to receive your gift
          </p>
        </div>

        <button
          onClick={handleClaim}
          disabled={claiming || canClaim === false}
          className="glass-button w-full h-14 text-primary font-bold rounded-lg text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <span className="relative z-10 flex items-center justify-center gap-2">
            {claiming ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">card_giftcard</span>
                <span>Claim Gift</span>
              </>
            )}
          </span>
        </button>

        <div className="text-xs text-text-secondary-light text-center">
          <p>Gas fees will be required to claim this gift</p>
        </div>
      </div>
    </div>
  )
}
