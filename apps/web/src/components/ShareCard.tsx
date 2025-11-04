'use client'

import { useState } from 'react'

interface ShareCardProps {
  type: 'lucky_claim' | 'achievement' | 'packet_created'
  title: string
  amount?: string
  description?: string
  userName?: string
  achievementIcon?: string
}

export function ShareCard({
  type,
  title,
  amount,
  description,
  userName,
  achievementIcon,
}: ShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getBackgroundGradient = () => {
    switch (type) {
      case 'lucky_claim':
        return 'from-red-500/20 via-orange-500/20 to-yellow-500/20'
      case 'achievement':
        return 'from-purple-500/20 via-pink-500/20 to-blue-500/20'
      case 'packet_created':
        return 'from-green-500/20 via-teal-500/20 to-cyan-500/20'
      default:
        return 'from-primary/20 to-accent/20'
    }
  }

  const getEmoji = () => {
    switch (type) {
      case 'lucky_claim':
        return '🎉'
      case 'achievement':
        return '🏆'
      case 'packet_created':
        return '🎁'
      default:
        return '✨'
    }
  }

  const handleShare = async () => {
    setIsGenerating(true)

    try {
      // Generate share URL
      const shareUrl = window.location.href
      const shareText = `${getEmoji()} ${title}\n${description || ''}`

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        alert('Share link copied to clipboard!')
      }
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="glass-card p-6 rounded-xl space-y-4">
      {/* Preview Card */}
      <div
        className={`relative overflow-hidden rounded-xl p-8 bg-gradient-to-br ${getBackgroundGradient()} border border-white/20`}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-4">
          {/* Icon/Emoji */}
          <div className="text-6xl mb-2">{achievementIcon || getEmoji()}</div>

          {/* Title */}
          <h3 className="text-2xl font-black text-text-primary-light">{title}</h3>

          {/* Amount (if applicable) */}
          {amount && (
            <div className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {amount}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-text-secondary-light text-sm max-w-xs mx-auto">{description}</p>
          )}

          {/* User name */}
          {userName && (
            <p className="text-text-primary-light text-xs">
              by <span className="font-bold">{userName}</span>
            </p>
          )}

          {/* Branding */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary-light">
              <span className="font-bold text-primary">LuckyPacket</span>
              <span>•</span>
              <span>Base Chain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="glass-button flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-primary/10 transition disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-primary">share</span>
          <span className="text-xs font-medium text-text-primary-light">Share</span>
        </button>

        <button
          onClick={() => {
            /* TODO: Share to Farcaster */
          }}
          className="glass-button flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-purple-500/10 transition"
        >
          <span className="text-purple-500 text-2xl">🟣</span>
          <span className="text-xs font-medium text-text-primary-light">Farcaster</span>
        </button>

        <button
          onClick={() => {
            /* TODO: Download as image */
          }}
          className="glass-button flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent/10 transition"
        >
          <span className="material-symbols-outlined text-accent">download</span>
          <span className="text-xs font-medium text-text-primary-light">Save</span>
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-text-secondary-light text-center">
        Share your achievement with friends and show off! 🎊
      </p>
    </div>
  )
}
