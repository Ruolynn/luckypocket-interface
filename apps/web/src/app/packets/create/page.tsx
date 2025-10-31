'use client'
import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRedPacketContract } from '../../../hooks/useRedPacket'
import { useERC20, useTokenBalance, useTokenAllowance, useTokenDecimals, useTokenSymbol } from '../../../hooks/useERC20'
import { parseUnits, formatUnits, keccak256, toHex } from 'viem'
import { useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { RED_PACKET_ABI } from '../../../constants/abi'
import Link from 'next/link'
import { api } from '../../../utils/api'

const RED_PACKET_ADDRESS = (process.env.NEXT_PUBLIC_RED_PACKET_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000'
const SEPOLIA_USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' // Sepolia USDC 测试币

export default function CreatePacketPage() {
  const { address } = useAccount()
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>(SEPOLIA_USDC as `0x${string}`)
  const [amountInput, setAmountInput] = useState('1') // 用户输入的金额（如 "1" USDC）
  const [count, setCount] = useState(10)
  const [isRandom, setIsRandom] = useState(true)
  const [message, setMessage] = useState('新年快乐!')
  const [expireHours, setExpireHours] = useState(24)
  const [jwt, setJwt] = useState<string>('')
  const { signMessageAsync } = useSignMessage()

  // ERC20 hooks
  const { data: decimals = 6n } = useTokenDecimals(tokenAddress)
  const { data: balance } = useTokenBalance(tokenAddress, address)
  const { data: allowance } = useTokenAllowance(tokenAddress, address, RED_PACKET_ADDRESS)
  const { data: symbol = 'USDC' } = useTokenSymbol(tokenAddress)
  const { approve, isPending: isApproving, isSuccess: isApproved } = useERC20(tokenAddress)

  // RedPacket hooks
  const { createPacket, hash: createHash, isPending: isCreating } = useRedPacketContract()
  const { isLoading: isWaitingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash })

  // 计算实际需要的授权金额（加 10% 容差）
  const totalAmount = parseUnits(amountInput || '0', Number(decimals))
  const requiredAllowance = (totalAmount * 110n) / 100n

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

  const handleApprove = async () => {
    await approve(RED_PACKET_ADDRESS, requiredAllowance)
  }

  const handleCreate = async () => {
    if (!address) {
      alert('请先连接钱包')
      return
    }
    if (!jwt) {
      await siweLogin()
      if (!jwt) return
    }

    // 检查授权
    if (!allowance || allowance < totalAmount) {
      alert('请先授权代币')
      return
    }

    try {
      const salt = keccak256(toHex(crypto.getRandomValues(new Uint8Array(32))))
      const duration = BigInt(expireHours * 3600)

      await createPacket(tokenAddress, totalAmount, count, isRandom, duration, salt)
      // 等待交易确认，事件监听会在 useEffect 中处理
    } catch (err: any) {
      alert('创建失败: ' + (err.message || '未知错误'))
    }
  }

  // 监听 PacketCreated 事件
  useWatchContractEvent({
    address: RED_PACKET_ADDRESS,
    abi: RED_PACKET_ABI,
    eventName: 'PacketCreated',
    onLogs: (logs) => {
      for (const log of logs) {
        const packetId = log.args.packetId
        if (packetId) {
          // 跳转到红包详情页
          window.location.href = `/packets/${packetId}`
        }
      }
    },
  })

  // 交易成功后提示
  useEffect(() => {
    if (isCreateSuccess && createHash) {
      // 等待事件触发跳转，如果 5 秒后还没跳转，显示提示
      const timer = setTimeout(() => {
        alert('红包创建成功！交易哈希: ' + createHash + '\n正在等待链上确认，请稍后刷新')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isCreateSuccess, createHash])

  const needsApproval = !allowance || allowance < totalAmount
  const hasBalance = balance && balance >= totalAmount

  if (!address) {
    return (
      <main style={{ padding: 24 }}>
        <h2>创建红包</h2>
        <p>请先连接钱包</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2>创建红包</h2>
      
      <div style={{ marginBottom: 16 }}>
        <label>代币地址</label>
        <input
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
          style={{ width: '100%', padding: 8 }}
          placeholder="0x..."
        />
        <small>当前代币: {symbol}，余额: {balance ? formatUnits(balance, Number(decimals)) : '0'}</small>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>金额 ({symbol})</label>
        <input
          type="number"
          step="0.01"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
        {!hasBalance && <div style={{ color: 'red' }}>余额不足</div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>份数 (1-200)</label>
        <input
          type="number"
          min="1"
          max="200"
          value={count}
          onChange={(e) => setCount(Math.min(200, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={isRandom}
            onChange={(e) => setIsRandom(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          随机金额（拼手气）
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>祝福语 (≤100字)</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 100))}
          style={{ width: '100%', padding: 8 }}
          maxLength={100}
        />
        <small>{message.length}/100</small>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>有效期（小时，≤168小时）</label>
        <input
          type="number"
          min="1"
          max="168"
          value={expireHours}
          onChange={(e) => setExpireHours(Math.min(168, Math.max(1, parseInt(e.target.value, 10) || 24)))}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {needsApproval && (
        <button
          onClick={handleApprove}
          disabled={!hasBalance || isApproving || isApproved}
          style={{ width: '100%', padding: 12, marginBottom: 12, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
        >
          {isApproving ? '授权中...' : isApproved ? '已授权' : `授权 ${symbol}`}
        </button>
      )}

      <button
        onClick={handleCreate}
        disabled={!hasBalance || needsApproval || isCreating || isWaitingCreate}
        style={{ width: '100%', padding: 12, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4 }}
      >
        {isCreating || isWaitingCreate ? '创建中...' : isCreateSuccess ? '创建成功！' : '创建红包'}
      </button>

      {createHash && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <p>交易哈希: {createHash}</p>
          <Link href={`/packets/${createHash}`}>查看红包详情</Link>
        </div>
      )}
    </main>
  )
}


