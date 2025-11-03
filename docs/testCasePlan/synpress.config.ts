// synpress.config.ts
import { defineConfig } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

export default defineConfig({
  // Playwright 基础配置
  testDir: './tests/e2e',
  fullyParallel: false, // 钱包测试不能并行
  timeout: 60000, // 60秒超时
  expect: {
    timeout: 10000
  },
  
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  // ⭐ Synpress MetaMask 配置
  synpress: {
    wallet: {
      // 使用测试助记词
      seedPhrase: 'test test test test test test test test test test test junk',
      // 或者使用私钥
      // privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      
      // 密码
      password: 'TestPassword123!',
      
      // 默认网络
      network: {
        name: 'Sepolia',
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
        chainId: 11155111
      }
    },
    
    // MetaMask 扩展版本
    metamaskVersion: '11.0.0',
    
    // 自动导入代币
    autoImportTokens: true,
    
    // 自动切换网络
    autoSwitchNetwork: true
  },
  
  projects: [
    {
      name: 'synpress',
      testMatch: '**/*.spec.ts'
    }
  ]
})
