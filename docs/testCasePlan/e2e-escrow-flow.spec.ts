// tests/e2e/escrow-flow.spec.ts
import { test, expect } from '@playwright/test'
import { MetaMask, testWithSynpress } from '@synthetixio/synpress'

// ⭐ 使用 Synpress 扩展 Playwright
testWithSynpress('托管支付完整流程', async ({ context, page, metamask }) => {
  
  // 1. 访问应用
  await page.goto('http://localhost:9000')
  
  // 2. ⭐ 自动连接钱包 (无需手动点击)
  await page.click('button:has-text("Connect Wallet")')
  
  // Synpress 自动处理 MetaMask 弹窗
  await metamask.connectToDapp()
  
  // 验证连接成功
  await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible()
  
  // 3. 创建托管支付
  await page.click('button:has-text("New Escrow")')
  
  // 填写表单
  await page.fill('[name="receiver"]', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  await page.fill('[name="amount"]', '0.1')
  await page.selectOption('[name="token"]', 'ETH')
  await page.fill('[name="unlockTime"]', '1') // 1小时
  
  // 点击创建
  await page.click('button[type="submit"]')
  
  // 4. ⭐ 自动确认 MetaMask 交易
  await metamask.confirmTransaction()
  
  // 5. 等待交易确认
  await expect(page.locator('.toast:has-text("Transaction confirmed")')).toBeVisible({
    timeout: 30000
  })
  
  // 6. 验证托管已创建
  await page.click('a[href="/escrows"]')
  await expect(page.locator('.escrow-card').first()).toBeVisible()
  
  // 7. 验证状态
  const status = await page.locator('.escrow-card .status').first().textContent()
  expect(status).toBe('CONFIRMED')
})

testWithSynpress('隐私支付流程', async ({ page, metamask }) => {
  await page.goto('http://localhost:9000/privacy')
  
  // 连接钱包
  await metamask.connectToDapp()
  
  // 注册隐私密钥
  await page.click('button:has-text("Register Privacy Keys")')
  
  // 自动签名消息
  await metamask.confirmSignature()
  
  // 发送隐私支付
  await page.fill('[name="recipient"]', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')
  await page.fill('[name="amount"]', '0.05')
  await page.click('button:has-text("Send Private Payment")')
  
  // 确认交易
  await metamask.confirmTransaction()
  
  // 验证成功
  await expect(page.locator('.success-message')).toContainText('Payment sent')
})

// ⭐ 错误场景测试
testWithSynpress('用户拒绝交易', async ({ page, metamask }) => {
  await page.goto('http://localhost:9000')
  await metamask.connectToDapp()
  
  await page.click('button:has-text("New Escrow")')
  await page.fill('[name="receiver"]', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  await page.fill('[name="amount"]', '0.1')
  await page.click('button[type="submit"]')
  
  // 用户拒绝交易
  await metamask.rejectTransaction()
  
  // 应该显示错误提示
  await expect(page.locator('.error-toast')).toContainText('Transaction rejected')
  
  // 页面状态应该恢复正常
  await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
})

// ⭐ 网络切换测试
testWithSynpress('切换到错误网络', async ({ page, metamask }) => {
  await page.goto('http://localhost:9000')
  await metamask.connectToDapp()
  
  // 切换到主网 (错误的网络)
  await metamask.switchNetwork('Ethereum Mainnet')
  
  // 应该显示网络错误
  await expect(page.locator('.network-warning')).toContainText(
    'Please switch to Sepolia'
  )
  
  // 点击切换网络按钮
  await page.click('button:has-text("Switch Network")')
  
  // MetaMask 自动切换
  await metamask.allowToSwitchNetwork()
  
  // 验证切换成功
  await expect(page.locator('.network-indicator')).toContainText('Sepolia')
})
