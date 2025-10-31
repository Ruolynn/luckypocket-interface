'use client'
import { useState, useEffect } from 'react'
import { api } from '../../utils/api'

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null)
  const [type, setType] = useState<'luck' | 'generous' | 'active'>('luck')
  const [range, setRange] = useState<'week' | 'month' | 'realtime'>('week')

  useEffect(() => {
    api(`/api/leaderboard?type=${type}&range=${range}`)
      .then(setData)
      .catch(console.error)
  }, [type, range])

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>🏆 排行榜</h2>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ padding: 8 }}>
          <option value="luck">手气榜</option>
          <option value="generous">慷慨榜</option>
          <option value="active">活跃榜</option>
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value as any)} style={{ padding: 8 }}>
          <option value="week">周</option>
          <option value="month">月</option>
          <option value="realtime">实时</option>
        </select>
      </div>

      {data?.top && Array.isArray(data.top) && data.top.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.top.map((item: string, idx: number) => (
            <li key={idx} style={{ padding: 12, marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
              {idx + 1}. {item}
            </li>
          ))}
        </ul>
      ) : (
        <p>暂无数据</p>
      )}
    </main>
  )
}

