'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/create', label: 'Create', icon: 'add_circle' },
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/invite', label: 'Invite', icon: 'group_add' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 md:hidden safe-area-bottom backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] rounded-lg transition-colors touch-manipulation ${
              isActive(item.href)
                ? 'text-primary'
                : 'text-text-secondary-light'
            }`}
          >
            <span className={`material-symbols-outlined text-2xl ${isActive(item.href) ? 'font-bold' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-xs font-medium ${isActive(item.href) ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

