'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AssistUnlockProps {
  baseAmount: string
  bonusAmount: string
  requiredInvites: number
  currentInvites: number
  inviteCode: string
}

export function AssistUnlock({
  baseAmount,
  bonusAmount,
  requiredInvites,
  currentInvites,
  inviteCode,
}: AssistUnlockProps) {
  const [copied, setCopied] = useState(false)
  const progress = (currentInvites / requiredInvites) * 100
  const isComplete = currentInvites >= requiredInvites

  const inviteLink = `${window.location.origin}/invite?code=${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join LuckyPacket!',
        text: `Join me on LuckyPacket and we both get rewards! 🎁`,
        url: inviteLink,
      })
    }
  }

  return (
    <div className="glass-card p-6 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary-light flex items-center gap-2">
          <span className="material-symbols-outlined text-accent">group_add</span>
          {isComplete ? 'Bonus Unlocked!' : 'Unlock Your Bonus'}
        </h3>
        {isComplete && (
          <span className="text-2xl">🎉</span>
        )}
      </div>

      {/* Amount breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-xs text-text-secondary-light mb-1">Base Amount</p>
          <p className="text-xl font-bold text-primary">+{baseAmount}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-xs text-text-secondary-light mb-1">Bonus Amount</p>
          <p className="text-xl font-bold text-accent">+{bonusAmount}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary-light">
            Progress: {currentInvites}/{requiredInvites} friends
          </span>
          <span className="font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      {!isComplete ? (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
          <p className="text-sm text-text-primary-light">
            <strong>How to unlock:</strong> Invite {requiredInvites - currentInvites} more friend
            {requiredInvites - currentInvites > 1 ? 's' : ''} to register using your link
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 glass-button flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-primary font-medium hover:bg-primary/10 transition"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 glass-button flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-primary font-medium hover:bg-primary/10 transition"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Share
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-medium mb-2">
            ✅ Congratulations! Your bonus has been unlocked!
          </p>
          <p className="text-xs text-text-secondary-light">
            The bonus amount will be credited to your wallet shortly.
          </p>
        </div>
      )}

      {/* FAQ Link */}
      <Link
        href="/docs"
        className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">help</span>
        How does assist unlock work?
      </Link>
    </div>
  )
}
