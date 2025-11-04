export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
    </div>
  )
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <LoadingSpinner size="lg" />
      {message && <p className="text-text-secondary-light text-sm">{message}</p>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="glass-card p-6 rounded-xl flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary-light">{title}</h3>
        {message && <p className="text-sm text-text-secondary-light max-w-md">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="glass-button flex items-center gap-2 px-6 py-3 rounded-lg text-primary font-medium hover:bg-primary/10 transition"
        >
          <span className="material-symbols-outlined">refresh</span>
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
}: {
  icon?: string
  title: string
  message?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl">{icon}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-text-primary-light">{title}</h3>
        {message && <p className="text-sm text-text-secondary-light max-w-md">{message}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="glass-button px-6 py-3 rounded-lg text-primary font-medium hover:bg-primary/10 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
