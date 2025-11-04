'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function RainPage() {
  const [nextRainTime, setNextRainTime] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  // Calculate next rain time (example: next 6-hour interval)
  useEffect(() => {
    const now = new Date()
    const nextHour = new Date(now)
    const hour = now.getHours()
    const nextInterval = [12, 18, 22].find((h) => h > hour) || 12
    nextHour.setHours(nextInterval, 0, 0, 0)
    if (nextHour <= now) {
      nextHour.setDate(nextHour.getDate() + 1)
      nextHour.setHours(12, 0, 0, 0)
    }
    setNextRainTime(nextHour)
  }, [])

  useEffect(() => {
    if (!nextRainTime) return

    const timer = setInterval(() => {
      const now = new Date()
      const diff = nextRainTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [nextRainTime])

  const rainHistory = [
    { date: '2024-11-03 18:00', amount: '5 ETH', participants: 234 },
    { date: '2024-11-03 12:00', amount: '3 ETH', participants: 189 },
    { date: '2024-11-02 22:00', amount: '7 ETH', participants: 456 },
  ]

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 py-4 xs:py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 px-3 xs:px-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-text-primary-light leading-tight tracking-[-0.033em]">
              Lucky Packet Rain
            </h1>
            <p className="text-sm xs:text-base text-text-secondary-light">
              Daily packet rains at 12:00, 18:00, and 22:00 UTC
            </p>
          </div>
        </div>

        {/* Countdown Card */}
        <div className="px-3 xs:px-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30 p-6 xs:p-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-accent rounded-full blur-3xl"></div>
            </div>
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="material-symbols-outlined text-3xl xs:text-4xl text-primary">
                  rainy
                </span>
                <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light">
                  Next Rain Countdown
                </h2>
              </div>
              <div className="flex items-center justify-center gap-3 xs:gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="text-4xl xs:text-5xl font-black text-primary">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs xs:text-sm text-text-secondary-light mt-1">Hours</div>
                </div>
                <div className="text-3xl xs:text-4xl font-bold text-primary">:</div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl xs:text-5xl font-black text-primary">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs xs:text-sm text-text-secondary-light mt-1">Minutes</div>
                </div>
                <div className="text-3xl xs:text-4xl font-bold text-primary">:</div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl xs:text-5xl font-black text-primary">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs xs:text-sm text-text-secondary-light mt-1">Seconds</div>
                </div>
              </div>
              <p className="text-sm text-text-secondary-light">
                Be ready to claim when the rain starts!
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 px-3 xs:px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-2xl text-primary">info</span>
              <h3 className="text-base xs:text-lg font-bold text-text-primary-light">How It Works</h3>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary-light">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>Packet rains happen 3 times daily</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>First-come-first-served basis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>Connect wallet to participate</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 xs:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-2xl text-primary">schedule</span>
              <h3 className="text-base xs:text-lg font-bold text-text-primary-light">Schedule</h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { time: '12:00 UTC', label: 'Noon Rain' },
                { time: '18:00 UTC', label: 'Evening Rain' },
                { time: '22:00 UTC', label: 'Night Rain' },
              ].map((item) => (
                <div key={item.time} className="flex justify-between items-center">
                  <span className="text-text-secondary-light">{item.label}</span>
                  <span className="font-medium text-text-primary-light">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="px-3 xs:px-4">
          <h2 className="text-lg xs:text-xl font-bold text-text-primary-light mb-4">
            Recent Rain History
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {rainHistory.map((rain, index) => (
                <div key={index} className="p-4 hover:bg-surface-light transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary-light">{rain.date}</p>
                      <p className="text-xs text-text-secondary-light mt-1">
                        {rain.participants} participants
                      </p>
                    </div>
                    <p className="text-base font-bold text-text-primary-light">{rain.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Join Button */}
        <div className="px-3 xs:px-4">
          <button className="w-full h-12 xs:h-14 bg-primary text-white font-bold rounded-xl text-base xs:text-lg hover:bg-primary/90 active:bg-primary/80 transition-colors touch-manipulation shadow-lg shadow-primary/30">
            Notify Me When Rain Starts
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

