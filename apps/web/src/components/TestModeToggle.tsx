'use client'

import { useState, useEffect } from 'react'

export function TestModeToggle() {
  const [isTestMode, setIsTestMode] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  useEffect(() => {
    // Load test mode state from localStorage
    const savedTestMode = localStorage.getItem('testMode') === 'true'
    const savedWalletState = localStorage.getItem('mockWalletConnected') === 'true'
    setIsTestMode(savedTestMode)
    setIsWalletConnected(savedWalletState)
  }, [])

  const toggleTestMode = () => {
    const newState = !isTestMode
    setIsTestMode(newState)
    localStorage.setItem('testMode', String(newState))
    if (!newState) {
      // Reset wallet state when disabling test mode
      setIsWalletConnected(false)
      localStorage.setItem('mockWalletConnected', 'false')
    }
    // Reload page to apply changes
    window.location.reload()
  }

  const toggleWallet = () => {
    if (!isTestMode) return
    const newState = !isWalletConnected
    setIsWalletConnected(newState)
    localStorage.setItem('mockWalletConnected', String(newState))
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-text-primary-light">🧪 Test Mode</span>
        <button
          onClick={toggleTestMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isTestMode ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isTestMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isTestMode && (
        <>
          <div className="text-xs text-text-secondary-light mb-3 pb-3 border-b border-gray-200">
            Test mode enabled - No real wallet needed
          </div>

          <div className="space-y-2">
            <button
              onClick={toggleWallet}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                isWalletConnected
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {isWalletConnected ? '✅ Wallet Connected' : '❌ Wallet Disconnected'}
            </button>

            {isWalletConnected && (
              <div className="text-xs text-text-secondary-light p-2 bg-surface-light rounded">
                Mock Address: 0x1234...5678
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
