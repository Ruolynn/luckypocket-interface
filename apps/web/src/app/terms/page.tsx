'use client'

import { MainLayout } from '@/components/MainLayout'

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs xs:text-sm text-text-secondary-light">
            Last updated: November 3, 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              By accessing and using Lucky Packet, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">2. Service Description</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              Lucky Packet is a decentralized application (dApp) that allows users to create and claim digital
              lucky packets on the blockchain. Our service operates on Base Sepolia testnet and is provided
              "as is" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">3. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>You are responsible for maintaining the security of your wallet and private keys.</li>
              <li>You must be of legal age to use this service in your jurisdiction.</li>
              <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
              <li>You understand that blockchain transactions are irreversible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">4. Risk Disclaimer</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              Using Lucky Packet involves risks, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Loss of funds due to smart contract vulnerabilities or bugs</li>
              <li>Market volatility affecting token values</li>
              <li>Network congestion or failures</li>
              <li>Regulatory changes affecting blockchain technology</li>
            </ul>
            <p className="text-sm text-text-secondary-light leading-relaxed mt-3">
              You acknowledge and accept these risks and agree that Lucky Packet shall not be liable for any
              losses incurred.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">5. Fees</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              Lucky Packet charges a 2% platform fee on all packet creation transactions, plus standard blockchain
              gas fees. All fees are non-refundable once a transaction is confirmed on the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">6. Limitation of Liability</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              To the maximum extent permitted by law, Lucky Packet and its operators shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">7. Changes to Terms</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>

        {/* Contact */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-text-secondary-light">
            Questions about these terms? <a href="/contact" className="text-primary hover:underline">Contact us</a>.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

