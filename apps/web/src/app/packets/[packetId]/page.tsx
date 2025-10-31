'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
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
  const [packet, setPacket] = useState<any>()
  const [claims, setClaims] = useState<any[]>([])
  const [jwt, setJwt] = useState<string>('')
  const { signMessageAsync } = useSignMessage()

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

  const siweLogin = async () => {
    if (!address) return
    const { nonce } = await api('/api/auth/siwe/nonce')
    const domain = typeof window !== 'undefined' ? window.location.host : 'localhost'
    const chainId = 11155111
    const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to HongBao dApp\n\nURI: https://${domain}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`
    const signature = await signMessageAsync({ message })
    const { token } = await api('/api/auth/siwe/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })
    setJwt(token)
  }

  const handleClaim = async () => {
    if (!packetId) return
    if (!address) {
      alert('请先连接钱包')
      return
    }
    if (!jwt) {
      await siweLogin()
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
      <main style={{ padding: 24 }}>
        <div>加载中...</div>
      </main>
    )
  }

  const displayInfo = chainInfo || packet
  const isExpired = displayInfo?.expireTime ? Number(displayInfo.expireTime) * 1000 < Date.now() : false
  const canClaim = displayInfo?.remainingCount > 0 && !isExpired && address
  const hasClaimed = claims.some((c) => c.userId === address?.toLowerCase())
  const isRandom = displayInfo?.isRandom || packet?.isRandom

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: '#2196F3' }}>← 返回首页</Link>
      </div>

      <h2>红包详情</h2>

      <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
        <div><strong>红包ID:</strong> {packetId}</div>
        <div><strong>创建者:</strong> {displayInfo?.creator || packet?.creatorId}</div>
        <div><strong>总金额:</strong> {displayInfo ? formatUnits(displayInfo.totalAmount || 0n, 6) : packet?.totalAmount}</div>
        <div><strong>总份数:</strong> {displayInfo?.count || packet?.count}</div>
        <div><strong>剩余份数:</strong> {displayInfo?.remainingCount ?? packet?.remainingCount ?? 0}</div>
        <div><strong>类型:</strong> {isRandom ? '随机（拼手气）' : '固定金额'}</div>
        <div><strong>状态:</strong> {isExpired ? '已过期' : canClaim ? '可领取' : '已领完'}</div>
        {isRandom && (
          <div style={{ marginTop: 8, color: '#666' }}>
            如显示“随机未就绪”，请稍候或刷新，系统将在随机数回填后自动可领。
          </div>
        )}
        {packet?.message && <div><strong>祝福语:</strong> {packet.message}</div>}
      </div>

      {isRandom && !isExpired && !hasClaimed && (
        <div style={{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 4, marginBottom: 16 }}>
          如果创建的是随机红包：随机切分就绪后方可领取。
        </div>
      )}

      {canClaim && !hasClaimed && (
        <button
          onClick={handleClaim}
          disabled={isClaiming}
          style={{ width: '100%', padding: 12, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, marginBottom: 16 }}
        >
          {isClaiming ? '领取中...' : '领取红包'}
        </button>
      )}

      {hasClaimed && (
        <div style={{ padding: 12, backgroundColor: '#E8F5E9', borderRadius: 4, marginBottom: 16 }}>
          您已领取过此红包
        </div>
      )}

      <h3>领取记录 ({claims.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {claims.length === 0 ? (
          <li style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>暂无领取记录</li>
        ) : (
          claims.map((c, idx) => (
            <li key={c.id || idx} style={{ padding: 12, marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
              <div>
                <strong>{c.userId || c.user?.address || 'Unknown'}</strong>
              </div>
              <div>金额: {formatUnits(BigInt(c.amount || 0), 6)} USDC</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {new Date(c.claimedAt).toLocaleString('zh-CN')}
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  )
}


