'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRedPacketContract, usePacketInfo } from '../../../hooks/useRedPacket'
import { formatUnits } from 'viem'
import io from 'socket.io-client'
import Link from 'next/link'

async function api(url: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const res = await fetch(base + url, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export default function PacketDetailPage() {
  const params = useParams<{ packetId: string }>()
  const { address } = useAccount()
  const { jwt, isAuthenticated, signIn, isAuthenticating } = useAuthContext()
  const [packet, setPacket] = useState<any>()
  const [claims, setClaims] = useState<any[]>([])

  const packetId = params?.packetId as `0x${string}` | undefined
  const { data: chainInfo, refetch: refetchChainInfo } = usePacketInfo(packetId)
  const { claimPacket, hash: claimHash, isPending: isClaiming } = useRedPacketContract()

  useEffect(() => {
    if (!params?.packetId) return
    const pid = params.packetId as string
    ;(async () => {
      try {
        const p = await api(`/api/packets/${pid}`)
        setPacket(p.packet)
        const c = await api(`/api/packets/${pid}/claims`)
        setClaims(c.claims)
      } catch (err) {
        console.error('Failed to load packet:', err)
      }
    })()

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token: jwt || '' },
    })
    socket.emit('subscribe:packet', pid)
    socket.on('packet:claimed', (evt) => {
      setClaims((prev) => [
        { id: crypto.randomUUID(), userId: evt.claimer, amount: evt.amount, claimedAt: new Date().toISOString() },
        ...prev,
      ])
      refetchChainInfo()
    })
    socket.on('packet:randomReady', () => {
      refetchChainInfo()
    })
    return () => {
      socket.emit('unsubscribe:packet', pid)
      socket.disconnect()
    }
  }, [params?.packetId, jwt, refetchChainInfo])

  const handleClaim = async () => {
    if (!packetId) return
    if (!address) {
      alert('请先连接钱包')
      return
    }
    if (!isAuthenticated) {
      alert('请先签名登录')
      await signIn()
      return
    }

    try {
      await claimPacket(packetId)
      // 交易提交后，等待事件同步更新
    } catch (err: any) {
      alert('领取失败: ' + (err.message || '未知错误'))
    }
  }

  if (!packet && !chainInfo) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </main>
    )
  }

  const displayInfo = chainInfo || packet
  const isExpired = displayInfo?.expireTime ? Number(displayInfo.expireTime) * 1000 < Date.now() : false
  const canClaim = displayInfo?.remainingCount > 0 && !isExpired && address
  const hasClaimed = claims.some((c) => c.userId === address?.toLowerCase())
  const isRandom = displayInfo?.isRandom || packet?.isRandom

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            ← 返回首页
          </Link>
        </div>

        <h2 className="text-4xl font-bold text-gray-900 mb-8">红包详情</h2>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">红包ID</div>
              <div className="font-mono text-sm break-all">{packetId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">创建者</div>
              <div className="font-mono text-sm">{displayInfo?.creator || packet?.creatorId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">总金额</div>
              <div className="text-xl font-bold text-primary-600">
                {displayInfo ? formatUnits(displayInfo.totalAmount || 0n, 6) : packet?.totalAmount} USDC
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">总份数</div>
              <div className="text-xl font-bold">{displayInfo?.count || packet?.count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">剩余份数</div>
              <div className="text-xl font-bold text-success-600">
                {displayInfo?.remainingCount ?? packet?.remainingCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">类型</div>
              <div className="font-semibold">
                {isRandom ? '🎲 随机（拼手气）' : '💰 固定金额'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">状态</div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isExpired
                    ? 'bg-gray-200 text-gray-700'
                    : canClaim
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isExpired ? '已过期' : canClaim ? '可领取' : '已领完'}
              </div>
            </div>
          </div>

          {isRandom && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                💡 如显示“随机未就绪”，请稍候或刷新，系统将在随机数回填后自动可领。
              </div>
            </div>
          )}

          {packet?.message && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">祝福语</div>
              <div className="mt-1 text-blue-900">{packet.message}</div>
            </div>
          )}
        </div>

        {isRandom && !isExpired && !hasClaimed && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              ⚠️ 如果创建的是随机红包：随机切分就绪后方可领取。
            </div>
          </div>
        )}

        {canClaim && !hasClaimed && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full py-4 px-6 bg-success-500 hover:bg-success-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all mb-6"
          >
            {isClaiming ? '领取中...' : '🎁 领取红包'}
          </button>
        )}

        {hasClaimed && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="text-success-800 font-semibold">✓ 您已领取过此红包</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            领取记录 ({claims.length})
          </h3>
          {claims.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无领取记录</div>
          ) : (
            <ul className="space-y-3">
              {claims.map((c, idx) => (
                <li
                  key={c.id || idx}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm text-gray-900 font-semibold">
                      {c.userId || c.user?.address || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(c.claimedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      {formatUnits(BigInt(c.amount || 0), 6)} USDC
                    </div>
                    {idx === 0 && (
                      <div className="text-xs text-yellow-600 font-semibold">🏆 手气最佳</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
