interface StatsCardProps {
  label: string
  value: string
  icon?: string
  iconColor?: 'primary' | 'accent' | 'green' | 'blue' | 'yellow'
}

// 根据 label 自动获取图标（如果未提供 icon prop）
function getIconForLabel(label: string): string {
  const lowerLabel = label.toLowerCase()
  if (lowerLabel.includes('packet')) return 'redeem'
  if (lowerLabel.includes('volume') || lowerLabel.includes('value') || lowerLabel.includes('amount')) return 'payments'
  if (lowerLabel.includes('user') || lowerLabel.includes('people')) return 'people'
  if (lowerLabel.includes('rate') || lowerLabel.includes('completion') || lowerLabel.includes('percent')) return 'trending_up'
  if (lowerLabel.includes('sent') || lowerLabel.includes('send')) return 'send'
  if (lowerLabel.includes('received') || lowerLabel.includes('claim')) return 'download'
  if (lowerLabel.includes('invite') || lowerLabel.includes('reward')) return 'card_giftcard'
  if (lowerLabel.includes('active')) return 'flash_on'
  return 'analytics'
}

// 根据 label 自动获取图标颜色（如果未提供 iconColor prop）
function getIconColorForLabel(label: string): 'primary' | 'accent' | 'green' | 'blue' | 'yellow' {
  const lowerLabel = label.toLowerCase()
  if (lowerLabel.includes('volume') || lowerLabel.includes('value') || lowerLabel.includes('amount')) return 'accent'
  if (lowerLabel.includes('user') || lowerLabel.includes('people')) return 'blue'
  if (lowerLabel.includes('rate') || lowerLabel.includes('completion')) return 'green'
  if (lowerLabel.includes('received') || lowerLabel.includes('claim')) return 'green'
  if (lowerLabel.includes('invite') || lowerLabel.includes('reward')) return 'yellow'
  return 'primary'
}

const iconColorClasses = {
  primary: 'text-primary bg-primary/10',
  accent: 'text-accent bg-accent/10',
  green: 'text-green-600 bg-green-500/10',
  blue: 'text-blue-600 bg-blue-500/10',
  yellow: 'text-yellow-600 bg-yellow-500/10',
}

export function StatsCard({ label, value, icon, iconColor }: StatsCardProps) {
  const displayIcon = icon || getIconForLabel(label)
  const displayColor = iconColor || getIconColorForLabel(label)

  return (
    <div className="glass-card-gradient flex flex-col items-center p-4 xs:p-6 rounded-xl transition-all scale-on-hover group cursor-pointer">
      {/* Icon with glow effect */}
      <div className={`flex items-center justify-center w-10 xs:w-12 h-10 xs:h-12 rounded-full mb-2 xs:mb-3 ${iconColorClasses[displayColor]} transition-transform group-hover:scale-110`}>
        <span className="material-symbols-outlined text-xl xs:text-2xl">{displayIcon}</span>
      </div>

      {/* Label */}
      <p className="text-text-secondary-light text-xs xs:text-sm font-medium mb-1 transition-colors group-hover:text-text-primary-light">{label}</p>

      {/* Value with neon glow on hover */}
      <p className="text-text-primary-light text-xl xs:text-2xl font-bold transition-all group-hover:scale-105">{value}</p>
    </div>
  )
}

