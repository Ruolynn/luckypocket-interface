/**
 * @file Skeleton Components
 * @description Loading skeletons for different UI elements
 */

'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <Skeleton className="mb-4 h-6 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex space-x-4 border-b pb-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/4" />
        </div>
      ))}
    </div>
  )
}
