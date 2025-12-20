import { Icon } from '@/components/ui/icon'

interface StatusBannerProps {
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishDate?: string
}

export function StatusBanner({ status, publishDate }: StatusBannerProps) {
  // Don't show banner for published posts
  if (status === 'published') {
    return null
  }

  const bannerConfig = {
    draft: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      border: 'border-yellow-400 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'FileText' as const,
      message: 'DRAFT - This post is not visible to the public',
    },
    scheduled: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      border: 'border-blue-400 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'Clock' as const,
      message: `SCHEDULED - Publishing on ${publishDate ? new Date(publishDate).toLocaleString() : 'unknown date'}`,
    },
    archived: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      border: 'border-orange-400 dark:border-orange-700',
      text: 'text-orange-800 dark:text-orange-200',
      icon: 'Archive' as const,
      message: 'ARCHIVED - This post is no longer publicly visible',
    },
  }

  const config = bannerConfig[status]

  return (
    <div className={`${config.bg} ${config.border} border-b w-full`}>
      <div className="container mx-auto px-4 py-3">
        <div className={`flex items-center justify-center gap-2 ${config.text} font-semibold text-sm`}>
          <Icon name={config.icon} className="h-4 w-4" />
          {config.message}
        </div>
      </div>
    </div>
  )
}
