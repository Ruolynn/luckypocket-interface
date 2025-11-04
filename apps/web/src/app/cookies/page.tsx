'use client'

import { MainLayout } from '@/components/MainLayout'

export default function CookiesPage() {
  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            Cookie Policy
          </h1>
          <p className="text-xs xs:text-sm text-text-secondary-light">
            Last updated: November 3, 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">1. What Are Cookies?</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help websites
              remember your preferences and improve your browsing experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">2. How We Use Cookies</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              Lucky Packet uses cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>
                <strong>Essential Cookies:</strong> Required for the website to function properly, such as
                session management and security
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website
                (anonymized data)
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and preferences, such as theme
                selection
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">3. Third-Party Cookies</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              We may use third-party services that set cookies, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Analytics providers (e.g., Google Analytics) - for website usage statistics</li>
              <li>Wallet providers - for wallet connection functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">4. Managing Cookies</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed mb-3">
              You can control and manage cookies through your browser settings. However, disabling certain
              cookies may affect website functionality:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary-light leading-relaxed">
              <li>Essential cookies cannot be disabled as they are necessary for basic functionality</li>
              <li>Analytics and preference cookies can be disabled through browser settings</li>
              <li>Each browser has different settings for managing cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">5. Local Storage</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              In addition to cookies, Lucky Packet may use browser local storage to remember your preferences
              and improve your experience. You can clear local storage through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary-light mb-3">6. Updates to This Policy</h2>
            <p className="text-sm text-text-secondary-light leading-relaxed">
              We may update this Cookie Policy from time to time. Please check this page periodically for
              updates. Continued use of our service after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>

        {/* Contact */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-text-secondary-light">
            Questions about our use of cookies? <a href="/contact" className="text-primary hover:underline">Contact us</a>.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

