# DeGift API 集成指南

本文档说明如何使用 DeGift 的 API 客户端和智能合约集成。

## 📦 文件结构

```
apps/web/src/lib/
├── api/
│   ├── gifts.ts          # Gift API 客户端（增强版）
│   └── client.ts         # 基础 API 客户端
├── contracts/
│   └── gift.ts           # 智能合约交互hooks
└── gift-types.ts         # TypeScript 类型定义
```

## 🎯 API 客户端使用

### 导入 API 客户端

```typescript
import { giftsAPI, APIError, NetworkError } from '@/lib/api/gifts'
```

### 创建礼物

```typescript
try {
  const result = await giftsAPI.createGift({
    giftType: 'TOKEN',
    token: '0x...', // ERC20 token address
    amount: '1.5',
    recipient: '0x...',
    message: 'Happy Birthday!',
    theme: 'classic-red',
    expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  console.log('Gift created:', result.giftId)
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.message, error.statusCode)
  } else if (error instanceof NetworkError) {
    console.error('Network Error:', error.message)
  }
}
```

### 获取礼物详情

```typescript
const gift = await giftsAPI.getGift('gift-id-here')
```

### 获取用户的礼物列表

```typescript
// 获取发送的礼物
const sentGifts = await giftsAPI.getUserSentGifts(address, {
  page: 1,
  limit: 20,
  status: 'ACTIVE',
})

// 获取接收的礼物
const receivedGifts = await giftsAPI.getUserReceivedGifts(address, {
  page: 1,
  limit: 20,
})
```

### 检查是否可以领取

```typescript
const { canClaim, reason } = await giftsAPI.canClaim('gift-id')
if (!canClaim) {
  console.log('Cannot claim:', reason)
}
```

## 🔗 智能合约集成

### 导入合约 Hooks

```typescript
import {
  useCreateGift,
  useClaimGift,
  useApproveToken,
  useCheckAllowance,
  parseGiftAmount,
  calculateExpireTime,
} from '@/lib/contracts/gift'
```

### 检查代币授权

```typescript
function MyComponent() {
  const { address } = useAccount()
  const { data: allowance } = useCheckAllowance(
    tokenAddress,
    address,
    true // enabled
  )

  return (
    <div>
      Current Allowance: {allowance?.toString()}
    </div>
  )
}
```

### 授权代币

```typescript
function ApproveButton() {
  const amount = parseUnits('10', 18) // 10 tokens
  const { approve, isLoading, isSuccess } = useApproveToken(
    tokenAddress,
    amount
  )

  return (
    <button onClick={() => approve?.()} disabled={isLoading}>
      {isLoading ? 'Approving...' : 'Approve'}
    </button>
  )
}
```

### 创建礼物（完整流程）

```typescript
function CreateGiftButton() {
  const { address } = useAccount()
  const { createGiftAsync, isLoading, isSuccess, txHash } = useCreateGift()

  const handleCreate = async () => {
    try {
      // 1. 准备参数
      const recipient = '0x...'
      const tokenAddress = '0x...'
      const amount = parseUnits('1.5', 18)
      const expireTime = calculateExpireTime(7) // 7 days
      const message = 'Happy Birthday!'

      // 2. 调用合约
      const tx = await createGiftAsync({
        args: [recipient, tokenAddress, amount, expireTime, message],
        value: BigInt(0), // For ETH gifts, set this to amount
      })

      // 3. 记录到后端
      await giftsAPI.createGift({
        giftType: 'TOKEN',
        token: tokenAddress,
        amount: '1.5',
        recipient,
        message,
        expireTime: new Date(Number(expireTime) * 1000).toISOString(),
      })

      console.log('Transaction hash:', tx.hash)
    } catch (error) {
      console.error('Error creating gift:', error)
    }
  }

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Gift'}
    </button>
  )
}
```

### 领取礼物

```typescript
function ClaimGiftButton({ giftId }: { giftId: string }) {
  const { claimGift, isLoading, isSuccess, txHash } = useClaimGift(
    BigInt(giftId),
    true // enabled
  )

  return (
    <div>
      <button onClick={() => claimGift?.()} disabled={isLoading}>
        {isLoading ? 'Claiming...' : 'Claim Gift'}
      </button>
      {isSuccess && (
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Transaction
        </a>
      )}
    </div>
  )
}
```

## 🔧 工具函数

### 解析金额

```typescript
import { parseGiftAmount } from '@/lib/contracts/gift'

// For tokens
const tokenAmount = parseGiftAmount('1.5', 'TOKEN', 18) // 1.5 * 10^18

// For NFTs
const nftId = parseGiftAmount('123', 'NFT') // 123n (bigint)
```

### 计算过期时间

```typescript
import { calculateExpireTime } from '@/lib/contracts/gift'

const expireTime = calculateExpireTime(7) // 7 days from now
```

### 格式化地址

```typescript
import { formatAddress } from '@/lib/contracts/gift'

const formatted = formatAddress('0x1234567890abcdef1234567890abcdef12345678')
// Output: "0x1234...5678"
```

### 验证地址

```typescript
import { isValidAddress } from '@/lib/contracts/gift'

if (isValidAddress(inputAddress)) {
  // Address is valid
}
```

## 🔄 错误处理

### API 错误

```typescript
try {
  await giftsAPI.createGift(data)
} catch (error) {
  if (error instanceof APIError) {
    console.log('Status:', error.statusCode)
    console.log('Code:', error.code)
    console.log('Details:', error.details)
  }
}
```

### 网络错误

```typescript
try {
  await giftsAPI.getGift(id)
} catch (error) {
  if (error instanceof NetworkError) {
    // Show network error message to user
    showNotification('Please check your internet connection')
  }
}
```

## ⚙️ 配置

### 环境变量

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_DEGIFT_CONTRACT_ADDRESS=0x...
```

### 重试配置

默认重试配置：
- 最大重试次数: 3
- 初始延迟: 1000ms
- 最大延迟: 5000ms
- 退避倍数: 2

可以自定义：

```typescript
import { GiftsAPI } from '@/lib/api/gifts'

const customGiftsAPI = new GiftsAPI(API_BASE_URL, {
  maxRetries: 5,
  initialDelay: 2000,
  maxDelay: 10000,
  backoffMultiplier: 3,
})
```

## 📝 类型定义

所有类型定义在 `apps/web/src/lib/gift-types.ts`：

- `Gift` - 礼物对象
- `GiftType` - 'TOKEN' | 'NFT'
- `GiftStatus` - 'PENDING' | 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'REFUNDED'
- `CreateGiftRequest` - 创建礼物请求
- `TokenInfo` - 代币信息
- `NFTMetadata` - NFT 元数据

## 🚀 完整示例

查看 `apps/web/src/components/gift/CreateGiftForm.tsx` 获取完整的实现示例。

## ⚠️ 注意事项

1. **授权流程**: ERC20 代币需要先授权才能创建礼物
2. **Gas 费用**: 确保用户有足够的 ETH 支付 gas
3. **交易确认**: 等待交易确认后再记录到后端
4. **错误处理**: 为用户提供清晰的错误信息
5. **合约地址**: 确保在环境变量中配置正确的合约地址

## 📚 相关文档

- [DeGift 功能架构](./DeGift功能架构.md)
- [DeGift 开发进度](./DeGift开发进度.md)
- [快速启动指南](./快速启动.md)
