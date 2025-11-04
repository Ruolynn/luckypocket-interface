'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ClaimRecord {
  address: string
  amount: string
  timestamp: number
  isLucky: boolean
}

export default function PacketDetailPage() {
  const { id } = useParams()
  const { isConnected: realIsConnected } = useAccount()
  const [isTestMode, setIsTestMode] = useState(false)
  const [mockConnected, setMockConnected] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    const testMode = localStorage.getItem('testMode') === 'true'
    const mockWallet = localStorage.getItem('mockWalletConnected') === 'true'
    setIsTestMode(testMode)
    setMockConnected(mockWallet)
  }, [])

  const isConnected = isTestMode ? mockConnected : realIsConnected
  const [isClaiming, setIsClaiming] = useState(false)
  const [vrfWaiting, setVrfWaiting] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 15, minutes: 30, seconds: 25 })
  const [claimedCount, setClaimedCount] = useState(5)
  const [totalCount] = useState(10)
  const [totalAmount] = useState('0.05')
  const [packetType] = useState<'fixed' | 'random'>('random')

  const claimHistory: ClaimRecord[] = [
    { address: '0x1b...dE3F', amount: '0.0031 ETH', timestamp: Date.now() - 120000, isLucky: false },
    { address: 'CryptoKing.eth', amount: '0.0045 ETH', timestamp: Date.now() - 300000, isLucky: true },
    { address: '0x5a...9bC2', amount: '0.0028 ETH', timestamp: Date.now() - 600000, isLucky: false },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClaim = async () => {
    if (!isConnected) return
    setIsClaiming(true)
    
    // Simulate VRF wait for random packets
    if (packetType === 'random') {
      setVrfWaiting(true)
      // Simulate waiting for VRF
      setTimeout(() => {
        setVrfWaiting(false)
        setClaimed(true)
        setIsClaiming(false)
        setClaimedCount((prev) => prev + 1)
      }, 3000)
    } else {
      setClaimed(true)
      setIsClaiming(false)
      setClaimedCount((prev) => prev + 1)
    }
  }

  const claimedAmount = (parseFloat(totalAmount) * (claimedCount / totalCount)).toFixed(4)

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-6 xs:py-8 sm:py-10 px-2 xs:px-0">
        <div className="w-full max-w-md mx-auto">
          <div className="glass-card p-4 xs:p-6 sm:p-8 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-4 xs:mb-6">
              <div className="flex items-center gap-2 mb-3 xs:mb-4">
                <img
                  className="w-7 xs:w-8 h-7 xs:h-8 rounded-full border-2 border-primary/30 flex-shrink-0"
                  alt="Avatar of the sender"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBymrM2MWOokoZfG-1NP-L06zMRuCjTZ03HcgdzHMigRXlELJuyzlVa9w7JEzutkoqObHtR0rAmLdMSPG9PNUkQkSKtvqSJUMWEz418jTM7nP2hqV12gVlpThpc1A64N_CczzRO_Gnlx2umt3BgqIlFT2JW0gXcD9wc3b7AfIyYGymx3-T9-1600f4BifH7iP2Ip-SwifQYENOAvkTbJhyWCU-hOsRk5ey4qbfsNrd0MAWlDNu57Ipedal8Q7c0qlW85WjaznyNm0Fc"
                />
                <p className="text-xs xs:text-sm text-text-secondary-light">
                  A gift from <span className="font-bold text-text-primary-light">vbuterin.eth</span>
                </p>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-text-primary-light mb-3 xs:mb-4 px-2">
                Happy New Year!
              </h1>
              <p className="text-xs xs:text-sm text-text-secondary-light mb-4 xs:mb-6 px-2">
                Wishing everyone in the community a prosperous year ahead.
              </p>
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
                  {packetType === 'random' ? 'Random Amount' : 'Fixed Amount'}
                </span>
              </div>
              <p className="text-2xl xs:text-3xl font-extrabold text-text-primary-light">
                {totalAmount} ETH
              </p>
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

            {/* Progress */}
            <div className="w-full mb-4 xs:mb-6">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-0 text-xs xs:text-sm text-text-secondary-light mb-2">
                <span>
                  Claimed: <span className="font-bold text-text-primary-light">{claimedCount} / {totalCount}</span> packets
                </span>
                <span>{claimedAmount} / {totalAmount} ETH</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 xs:h-2.5">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${(claimedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* VRF Waiting State */}
            {vrfWaiting && (
              <div className="glass-card w-full bg-blue-50/50 rounded-lg p-4 mb-4 text-center border border-blue-200/50">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <p className="text-sm font-medium">Waiting for random number generation...</p>
                </div>
                <p className="text-xs text-blue-600">This may take a few moments. Please don't close this page.</p>
              </div>
            )}

            {/* Claim Button */}
            {!claimed ? (
              !isConnected ? (
                <div className="w-full">
                  <ConnectButton />
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming || vrfWaiting || claimedCount >= totalCount}
                  className="glass-button w-full text-primary font-bold py-3 xs:py-3.5 px-4 xs:px-6 rounded-lg text-base xs:text-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative z-10">{isClaiming ? 'Claiming...' : claimedCount >= totalCount ? 'All Claimed' : 'Claim Now'}</span>
                </button>
              )
            ) : (
              <div className="glass-card w-full bg-green-50/50 rounded-lg p-4 text-center border border-green-200/50">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <p className="text-sm font-medium">Successfully Claimed!</p>
                </div>
                <p className="text-xs text-green-600">You received 0.0031 ETH</p>
                {/* Assist Prompt (P1) */}
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs xs:text-sm text-text-primary-light font-medium mb-2">
                    Invite 3 friends to unlock remaining 50%!
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-xs text-text-secondary-light">Progress: 1/3</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-primary h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                  <button className="text-xs xs:text-sm text-primary font-semibold hover:underline">
                    Share Invite Link
                  </button>
                </div>
              </div>
            )}

            {/* Claim History */}
            <div className="mt-6 xs:mt-8">
              <h2 className="text-base xs:text-lg font-semibold text-text-primary-light mb-3 xs:mb-4 text-center">
                Claim History
              </h2>
              <div className="space-y-3 xs:space-y-4 max-h-48 xs:max-h-60 overflow-y-auto pr-1 xs:pr-2">
                {claimHistory.map((record, index) => (
                  <div
                    key={index}
                    className="glass-card flex items-start justify-between p-2 xs:p-3 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                      <img
                        className="w-8 xs:w-10 h-8 xs:h-10 rounded-full flex-shrink-0"
                        alt="Avatar"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAakF7EkBaHHeK4khpo6XMDeWE8Q87LvuLcyXot5Y7_kstvWwXoPjcd8QRd3VQMRDqKwgo1bCLoTHRyvZcI7OBgFnIda90wRkRXeSqci_sSCXItXt7xRDAl2ru3_aWRxHrHnzLskuBAjyCfQXxlY4NZVAgvzfmvKD_VGezHkdk8x5eBZpOGyxTfHEJCer4XEDs2iQ6iZG6jYM0-eTSNQ5HsrP71qq62mhh1aYcOc7b9WUi7s8g-Nc_pPohivLHV4AOBNGpnyTVBTkGm"
                      />
                      <div className="min-w-0">
                        <span className="text-xs xs:text-sm font-medium text-text-primary-light truncate block">
                          {record.address}
                          {record.isLucky && (
                            <span className="ml-2 text-yellow-600">
                              <span className="material-symbols-outlined text-base align-middle">star</span>
                              <span className="text-xs">Lucky!</span>
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-text-secondary-light">
                          {Math.floor((Date.now() - record.timestamp) / 60000)} minutes ago
                        </p>
                      </div>
                    </div>
                    <span className="text-xs xs:text-sm font-bold text-text-primary-light whitespace-nowrap flex-shrink-0">
                      {record.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

