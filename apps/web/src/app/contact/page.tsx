'use client'

import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            Contact Us
          </h1>
          <p className="text-base xs:text-lg text-text-secondary-light max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
          {/* Community Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">forum</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary-light">Community</h2>
            </div>
            <p className="text-sm text-text-secondary-light mb-4">
              Join our community channels for real-time updates and discussions.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>Discord</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-base">alternate_email</span>
                <span>Twitter</span>
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-2xl">support_agent</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary-light">Support</h2>
            </div>
            <p className="text-sm text-text-secondary-light mb-4">
              Need help? Check our documentation or reach out for assistance.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/docs" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <span className="material-symbols-outlined text-base">menu_book</span>
                <span>Documentation</span>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-base">code</span>
                <span>GitHub Issues</span>
              </a>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 xs:p-8">
          <h3 className="text-lg font-bold text-text-primary-light mb-2">Business Inquiries</h3>
          <p className="text-sm text-text-secondary-light mb-4">
            For partnership opportunities or business inquiries, please contact us through our community channels
            or open an issue on GitHub.
          </p>
          <p className="text-xs text-text-secondary-light">
            <strong>Note:</strong> Lucky Packet is currently in beta on Base Sepolia testnet. Mainnet launch coming soon.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

