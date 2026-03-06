import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
}

export default function FreeTextWidget({ config }: Props) {
  const content = config.textContent || 'Double-click to edit...'

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="prose prose-sm max-w-none whitespace-pre-wrap" data-testid="freetext-content">
        {content}
      </div>
    </div>
  )
}
