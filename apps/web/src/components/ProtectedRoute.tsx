/**
 * @file Protected Route Component
 * @description Route guard for authenticated pages
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PageLoading } from '@/components/ui/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if authentication is required and user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      // Redirect to home page
      router.push('/')
    }
  }, [isAuthenticated, isLoading, requireAuth, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoading message="Checking authentication..." />
  }

  // If authentication is required but user is not authenticated, show loading
  // (will redirect in useEffect)
  if (requireAuth && !isAuthenticated) {
    return <PageLoading message="Redirecting..." />
  }

  return <>{children}</>
}
