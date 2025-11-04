'use client'

import { useState, useEffect } from 'react'

interface CountdownProps {
  targetTime: string | Date
  onExpire?: () => void
  showDays?: boolean
}

export function Countdown({ targetTime, onExpire, showDays = true }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetTime).getTime()
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setIsExpired(true)
        onExpire?.()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetTime, onExpire])

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <span className="material-symbols-outlined">schedule</span>
        <span className="font-medium">Expired</span>
      </div>
    )
  }

  const timeUnits = [
    ...(showDays && timeLeft.days > 0 ? [{ label: 'Days', value: timeLeft.days }] : []),
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="glass-card px-3 py-2 rounded-lg min-w-[50px] text-center">
              <span className="text-2xl font-black text-primary tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-text-secondary-light mt-1">{unit.label}</span>
          </div>
          {index < timeUnits.length - 1 && (
            <span className="text-2xl font-bold text-text-secondary-light">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Compact version for inline display
export function CompactCountdown({ targetTime }: { targetTime: string | Date }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetTime).getTime()
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft('Expired')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`)
      } else {
        setTimeLeft(`${minutes}m left`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [targetTime])

  return (
    <span className="text-sm text-text-secondary-light flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">schedule</span>
      {timeLeft}
    </span>
  )
}
