import { useEffect } from 'react'
import { socketClient } from '@/lib/socket'

export function useSocket(event: string, callback: (data: any) => void) {
  useEffect(() => {
    socketClient.on(event, callback)

    return () => {
      socketClient.off(event, callback)
    }
  }, [event, callback])
}

export function useSocketConnection() {
  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      socketClient.connect(token)
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  return {
    isConnected: socketClient.isConnected(),
    emit: socketClient.emit.bind(socketClient),
  }
}
