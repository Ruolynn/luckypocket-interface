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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">🏆 排行榜</h2>
        
        <div className="mb-8 flex gap-4 flex-wrap">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="luck">手气榜</option>
            <option value="generous">慷慨榜</option>
            <option value="active">活跃榜</option>
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">周</option>
            <option value="month">月</option>
            <option value="realtime">实时</option>
          </select>
        </div>

      {data?.top && Array.isArray(data.top) && data.top.length > 0 ? (
        <ul className="space-y-3">
          {data.top.map((item: { address: string; score: string }, idx: number) => (
            <li
              key={item.address || idx}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    idx === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : idx === 1
                      ? 'bg-gray-300 text-gray-700'
                      : idx === 2
                      ? 'bg-orange-300 text-orange-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <div>
                  <div className="font-mono text-sm text-gray-900">
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {type === 'luck' && '最佳手气: '}
                    {type === 'generous' && '累计发放: '}
                    {type === 'active' && '参与次数: '}
                    {parseFloat(item.score).toLocaleString('zh-CN')}
                    {type === 'generous' && ' USDC'}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 text-gray-500">暂无数据</div>
      )}
      </div>
    </main>
  )
}

