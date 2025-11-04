/**
 * @file Loading Components
 * @description Loading spinners and indicators
 */

'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-gray-300 border-t-blue-600 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface ButtonLoadingProps {
  className?: string
}

export function ButtonLoading({ className = '' }: ButtonLoadingProps) {
  return <LoadingSpinner size="sm" className={`inline-block ${className}`} />
}

interface TransactionLoadingProps {
  step: 'wallet' | 'pending' | 'confirming' | 'success' | 'error'
  message?: string
}

export function TransactionLoading({ step, message }: TransactionLoadingProps) {
  const stepMessages = {
    wallet: 'Waiting for wallet confirmation...',
    pending: 'Transaction submitted...',
    confirming: 'Waiting for block confirmation...',
    success: 'Transaction confirmed!',
    error: 'Transaction failed',
  }

  const stepColors = {
    wallet: 'text-blue-600',
    pending: 'text-yellow-600',
    confirming: 'text-yellow-600',
    success: 'text-green-600',
    error: 'text-red-600',
  }

  return (
    <div className="flex items-center space-x-3">
      {step !== 'success' && step !== 'error' && <LoadingSpinner size="sm" />}
      <span className={stepColors[step]}>{message || stepMessages[step]}</span>
    </div>
  )
}
