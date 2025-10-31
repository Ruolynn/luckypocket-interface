'use client'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { api } from '../../utils/api'

export default function InvitePage() {
  const { address } = useAccount()
  const [inviteCode, setInviteCode] = useState('')
  const [jwt, setJwt] = useState('')
  const [stats, setStats] = useState<any>(null)
  const { signMessageAsync } = useSignMessage()

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
    // 加载统计数据
    const s = await api('/api/invite/stats', { headers: { Authorization: `Bearer ${token}` } })
    setStats(s)
  }

  const handleAccept = async () => {
    if (!jwt) {
      await siweLogin()
      return
    }
    try {
      await api('/api/invite/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ inviterCode: inviteCode }),
      })
      alert('邀请接受成功！')
    } catch (err: any) {
      alert('失败: ' + (err.message || '未知错误'))
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2>🎁 邀请奖励</h2>
      
      {!address && <p>请先连接钱包</p>}
      
      {address && !jwt && (
        <button onClick={siweLogin} style={{ padding: 12, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4 }}>
          登录
        </button>
      )}

      {jwt && (
        <>
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <h3>我的邀请码</h3>
            <p style={{ fontFamily: 'monospace', fontSize: 18 }}>{address?.slice(0, 10)}...</p>
            <p>邀请统计: {stats?.total || 0} 人</p>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3>接受邀请</h3>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="输入邀请码"
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <button
              onClick={handleAccept}
              style={{ width: '100%', padding: 12, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
            >
              接受邀请
            </button>
          </div>
        </>
      )}
    </main>
  )
}

