'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'
import { useState } from 'react'

const config = getDefaultConfig({
  appName: 'LuckyPacket',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, baseSepolia],
  ssr: true,
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

