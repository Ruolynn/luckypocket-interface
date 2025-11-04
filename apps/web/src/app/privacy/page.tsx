'use client'

import { MainLayout } from '@/components/MainLayout'

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs xs:text-sm text-text-secondary-light">
            Last updated: November 3, 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">1. Introduction</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              Lucky Packet is committed to protecting your privacy. This Privacy Policy explains how we handle
              information when you use our decentralized application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">2. Information We Collect</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              As a decentralized application, Lucky Packet operates on the blockchain, which is inherently public.
              We may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Public blockchain addresses when you connect your wallet</li>
              <li>Transaction data that is publicly available on the blockchain</li>
              <li>Usage analytics (anonymized) to improve our service</li>
              <li>Technical information such as IP addresses and browser type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">3. How We Use Information</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Provide and improve our services</li>
              <li>Display transaction history and statistics</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">4. Blockchain Transparency</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              Please note that all transactions on the blockchain are public and permanent. Wallet addresses,
              transaction amounts, and smart contract interactions are visible to anyone on the blockchain explorer.
              We cannot control or limit this blockchain transparency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">5. Third-Party Services</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              Lucky Packet integrates with third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Wallet providers (MetaMask, Rainbow, etc.) - subject to their privacy policies</li>
              <li>Blockchain networks (Base Sepolia) - public by design</li>
              <li>Analytics services (anonymized data only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">6. Data Security</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              We implement industry-standard security measures to protect your information. However, as a
              decentralized application, you are responsible for securing your wallet and private keys.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">7. Your Rights</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Access information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of personal data (subject to blockchain immutability)</li>
              <li>Opt out of non-essential data collection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">8. Contact Us</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              For privacy-related questions or requests, please contact us through our{' '}
              <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

