'use client'

import { MainLayout } from '@/components/MainLayout'
import { useState } from 'react'
import Link from 'next/link'

type DocSection = 'getting-started' | 'creating' | 'claiming' | 'faq' | 'technical'

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started')

  const sections = [
    { id: 'getting-started' as DocSection, label: 'Getting Started', icon: 'rocket_launch' },
    { id: 'creating' as DocSection, label: 'Creating Packets', icon: 'add_circle' },
    { id: 'claiming' as DocSection, label: 'Claiming Packets', icon: 'redeem' },
    { id: 'faq' as DocSection, label: 'FAQ', icon: 'help' },
    { id: 'technical' as DocSection, label: 'Technical Details', icon: 'code' },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light">
            Documentation
          </h1>
          <p className="text-base xs:text-lg text-text-secondary-light">
            Everything you need to know about Lucky Packet
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-2 sticky top-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary-light hover:bg-surface-light'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 xs:p-8">
            {activeSection === 'getting-started' && (
              <div className="prose prose-sm sm:prose max-w-none">
                <h2 className="text-2xl font-bold text-text-primary-light mb-4">Getting Started</h2>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">1. Connect Your Wallet</h3>
                <p className="text-text-secondary-light mb-4">
                  To use Lucky Packet, you'll need a Web3 wallet like MetaMask, Rainbow, or Coinbase Wallet.
                  Click the "Connect Wallet" button in the top right corner to get started.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">2. Get Some ETH</h3>
                <p className="text-text-secondary-light mb-4">
                  Lucky Packet runs on Base Sepolia testnet. You'll need some testnet ETH to create packets and pay for gas fees.
                  Visit a Base Sepolia faucet to get free testnet tokens.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">3. Create or Claim</h3>
                <p className="text-text-secondary-light mb-4">
                  Once connected, you can either create a new lucky packet to share with others, or claim packets
                  that have been shared with you. Check out the specific guides for detailed instructions.
                </p>

                <div className="flex gap-3 mt-6">
                  <Link
                    href="/create"
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Packet
                  </Link>
                  <Link
                    href="/claim"
                    className="px-4 py-2 bg-surface-light border border-gray-200 text-text-primary-light font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Claim Packet
                  </Link>
                </div>
              </div>
            )}

            {activeSection === 'creating' && (
              <div className="prose prose-sm sm:prose max-w-none">
                <h2 className="text-2xl font-bold text-text-primary-light mb-4">Creating Lucky Packets</h2>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Choose Packet Type</h3>
                <ul className="space-y-3 text-text-secondary-light mb-6">
                  <li><strong className="text-text-primary-light">Fixed Amount:</strong> Each recipient gets the same amount</li>
                  <li><strong className="text-text-primary-light">Random Amount:</strong> Each recipient gets a different random amount</li>
                </ul>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Set Parameters</h3>
                <ul className="space-y-3 text-text-secondary-light mb-6">
                  <li><strong className="text-text-primary-light">Total Amount:</strong> The total value to distribute</li>
                  <li><strong className="text-text-primary-light">Number of Packets:</strong> How many people can claim (1-100)</li>
                  <li><strong className="text-text-primary-light">Duration:</strong> How long the packet remains valid (1-7 days)</li>
                  <li><strong className="text-text-primary-light">Token:</strong> Choose ETH, USDC, USDT, or custom token</li>
                </ul>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Add a Message</h3>
                <p className="text-text-secondary-light mb-4">
                  Include an optional blessing or message (up to 100 characters) to personalize your packet.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Fees</h3>
                <p className="text-text-secondary-light mb-4">
                  Lucky Packet charges a 2% platform fee plus standard gas fees for the transaction.
                </p>
              </div>
            )}

            {activeSection === 'claiming' && (
              <div className="prose prose-sm sm:prose max-w-none">
                <h2 className="text-2xl font-bold text-text-primary-light mb-4">Claiming Lucky Packets</h2>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Find a Packet</h3>
                <p className="text-text-secondary-light mb-4">
                  To claim a packet, you'll need either the packet ID or a direct link. You can get this from:
                </p>
                <ul className="space-y-2 text-text-secondary-light mb-6">
                  <li>A friend who created the packet</li>
                  <li>Social media posts</li>
                  <li>Community channels</li>
                </ul>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Connect & Claim</h3>
                <p className="text-text-secondary-light mb-4">
                  Make sure your wallet is connected, then navigate to the packet page and click "Claim Now".
                  For random packets, you'll see a brief waiting period while the VRF generates your amount.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Unlock More</h3>
                <p className="text-text-secondary-light mb-4">
                  Some packets require you to invite friends to unlock the full amount. Share your invite link
                  to maximize your rewards!
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Be quick! Packets are first-come, first-served and may run out before expiring.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'faq' && (
              <div className="prose prose-sm sm:prose max-w-none">
                <h2 className="text-2xl font-bold text-text-primary-light mb-6">Frequently Asked Questions</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">What is Lucky Packet?</h3>
                    <p className="text-text-secondary-light">
                      Lucky Packet is a decentralized application that allows you to create and share digital lucky
                      pockets on the blockchain, similar to traditional Asian gift-giving customs.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">Which networks are supported?</h3>
                    <p className="text-text-secondary-light">
                      Currently, Lucky Packet operates on Base Sepolia testnet. Mainnet support is coming soon.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">Are the random amounts truly random?</h3>
                    <p className="text-text-secondary-light">
                      Yes! We use Chainlink VRF (Verifiable Random Function) to ensure cryptographically secure and
                      provably fair random distribution.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">What happens to unclaimed packets?</h3>
                    <p className="text-text-secondary-light">
                      After the expiration time, any remaining funds in unclaimed packets can be refunded to the creator.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">Can I cancel a packet after creating it?</h3>
                    <p className="text-text-secondary-light">
                      Once created, packets cannot be canceled. However, you can refund unclaimed amounts after expiration.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light mb-2">Is there a limit on packet value?</h3>
                    <p className="text-text-secondary-light">
                      There's no strict limit, but we recommend keeping individual packets reasonable to ensure gas
                      efficiency and security.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'technical' && (
              <div className="prose prose-sm sm:prose max-w-none">
                <h2 className="text-2xl font-bold text-text-primary-light mb-4">Technical Details</h2>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Smart Contracts</h3>
                <p className="text-text-secondary-light mb-4">
                  Lucky Packet is built on Solidity smart contracts deployed on Base Sepolia. All transactions
                  are transparent and verifiable on the blockchain.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">VRF Integration</h3>
                <p className="text-text-secondary-light mb-4">
                  Random amount distribution uses Chainlink VRF v2 to ensure fairness. Each random request is
                  cryptographically verified and cannot be manipulated.
                </p>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Security</h3>
                <ul className="space-y-2 text-text-secondary-light mb-6">
                  <li>Audited smart contracts</li>
                  <li>Non-custodial design - you always control your funds</li>
                  <li>OpenZeppelin security standards</li>
                  <li>Reentrancy guards on all critical functions</li>
                </ul>

                <h3 className="text-xl font-bold text-text-primary-light mt-6 mb-3">Technology Stack</h3>
                <ul className="space-y-2 text-text-secondary-light mb-6">
                  <li>Solidity ^0.8.20</li>
                  <li>Next.js 14 with App Router</li>
                  <li>RainbowKit & Wagmi for wallet connection</li>
                  <li>Viem for blockchain interaction</li>
                  <li>Base Sepolia (Chain ID: 84532)</li>
                </ul>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-text-secondary-light">
                    <strong className="text-text-primary-light">Contract Address (Base Sepolia):</strong><br />
                    <code className="text-xs font-mono">0x...</code> (Coming soon)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
