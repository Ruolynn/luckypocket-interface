'use client'

import { MainLayout } from '@/components/MainLayout'
import Link from 'next/link'

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: 'Introducing Lucky Packet: Bringing Traditional Gift Culture to Web3',
      excerpt: 'Discover how Lucky Packet combines the joy of traditional Asian gift-giving with the power of blockchain technology.',
      date: '2024-11-01',
      author: 'Lucky Packet Team',
      category: 'Announcement',
    },
    {
      id: 2,
      title: 'How Chainlink VRF Ensures Fair Random Distribution',
      excerpt: 'Learn about our use of Chainlink VRF v2 to guarantee provably fair random amount distribution for every lucky packet.',
      date: '2024-10-28',
      author: 'Technical Team',
      category: 'Technical',
    },
    {
      id: 3,
      title: 'Getting Started: Your First Lucky Packet',
      excerpt: 'A step-by-step guide to creating and sharing your first lucky packet on Base Sepolia.',
      date: '2024-10-25',
      author: 'Community Team',
      category: 'Tutorial',
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 xs:space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 xs:space-y-4">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-text-primary-light leading-tight">
            Blog
          </h1>
          <p className="text-base xs:text-lg text-text-secondary-light max-w-2xl mx-auto">
            Stay updated with the latest news, updates, and tutorials from the Lucky Packet team.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border border-gray-200 p-6 xs:p-8 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-text-secondary-light">{post.date}</span>
                <span className="text-xs text-text-secondary-light">by {post.author}</span>
              </div>
              <h2 className="text-xl xs:text-2xl font-bold text-text-primary-light mb-3">
                {post.title}
              </h2>
              <p className="text-sm xs:text-base text-text-secondary-light mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <span>Read More</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </article>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 xs:p-8 text-center">
          <p className="text-text-secondary-light text-sm xs:text-base">
            More articles coming soon. Stay tuned!
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

