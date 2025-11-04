'use client'

import { useState, useEffect } from 'react'

interface VRFWaitingStateProps {
  onRetry?: () => void
  maxWaitTime?: number // seconds
}

export function VRFWaitingState({ onRetry, maxWaitTime = 30 }: VRFWaitingStateProps) {
  const [elapsed, setElapsed] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setElapsed(0)
    onRetry?.()
  }

  const showRetry = elapsed > 5
  const showTimeout = elapsed > maxWaitTime

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col items-center gap-4">
      {/* Animated loader */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">
            casino
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-text-primary-light">
          {showTimeout ? 'Taking Longer Than Expected...' : 'Generating Random Numbers'}
        </h3>
        <p className="text-text-secondary-light text-sm">
          {showTimeout
            ? 'The random number generation is taking longer than usual.'
            : 'Please wait while we use Chainlink VRF to ensure fairness...'}
        </p>
        <p className="text-text-secondary-light text-xs">
          Elapsed: {elapsed}s {retryCount > 0 && `(Retry ${retryCount})`}
        </p>
      </div>

      {/* Retry button */}
      {showRetry && (
        <button
          onClick={handleRetry}
          className="glass-button flex items-center gap-2 px-6 py-3 rounded-lg text-primary font-medium hover:bg-primary/10 transition"
        >
          <span className="material-symbols-outlined">refresh</span>
          {showTimeout ? 'Try Again' : 'Check Status'}
        </button>
      )}

      {/* Info */}
      <div className="text-xs text-text-secondary-light text-center max-w-md">
        💡 We use Chainlink VRF to ensure provably fair random distribution. This may take a few
        moments.
      </div>
    </div>
  )
}
