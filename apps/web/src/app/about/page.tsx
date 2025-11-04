'use client'

import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            About Lucky Packet
          </h1>
          <p className="text-base xs:text-lg text-text-secondary-light max-w-2xl mx-auto">
            Bringing the joy of lucky packets to the blockchain
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8">
          <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light mb-4">
            Our Mission
          </h2>
          <p className="text-sm xs:text-base text-text-secondary-light leading-relaxed mb-4">
            Lucky Packet is revolutionizing the way people share value on the blockchain. Inspired by the
            traditional Asian lucky pocket culture, we've created a modern, decentralized platform
            that brings the excitement of surprise gifts to Web3.
          </p>
          <p className="text-sm xs:text-base text-text-secondary-light leading-relaxed">
            Our platform combines the thrill of random rewards with the transparency and security of blockchain
            technology, making it easy for anyone to share luck with friends, family, and communities worldwide.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">lock</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary-light mb-2">Secure & Transparent</h3>
            <p className="text-sm text-text-secondary-light">
              Built on Base Sepolia with verifiable random functions (VRF) for provably fair distribution.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-accent text-2xl">flash_on</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary-light mb-2">Fast & Affordable</h3>
            <p className="text-sm text-text-secondary-light">
              Low gas fees and instant claims ensure a smooth experience for all users.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-yellow-600 text-2xl">casino</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary-light mb-2">Random Distribution</h3>
            <p className="text-sm text-text-secondary-light">
              Each claim is unique with our cryptographically secure random amount distribution.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-green-600 text-2xl">group</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary-light mb-2">Community First</h3>
            <p className="text-sm text-text-secondary-light">
              Invite friends, grow together, and unlock rewards through our referral system.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8">
          <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light mb-4">
            Built by Web3 Enthusiasts
          </h2>
          <p className="text-sm xs:text-base text-text-secondary-light leading-relaxed mb-6">
            Our team consists of blockchain developers, designers, and community builders passionate about
            making Web3 more accessible and fun. We believe in the power of decentralized technology to
            bring people together and create new ways of sharing value.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-surface-light border border-gray-200 rounded-lg text-sm font-medium text-text-primary-light hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">𝕏</span>
              Follow us on Twitter
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-surface-light border border-gray-200 rounded-lg text-sm font-medium text-text-primary-light hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">💬</span>
              Join our Discord
            </a>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 xs:p-8 text-center text-white">
          <h2 className="text-xl xs:text-2xl font-bold mb-3">
            Ready to Start Sharing Luck?
          </h2>
          <p className="text-sm xs:text-base text-white/90 mb-6 max-w-xl mx-auto">
            Create your first lucky packet today and experience the joy of giving on the blockchain.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-white/90 transition-colors touch-manipulation"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Lucky Packet
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
