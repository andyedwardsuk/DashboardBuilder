import { useMemo } from 'react'
import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
}

export default function IndicatorWidget({ config, rows }: Props) {
  const { value, label, percentage } = useMemo(() => {
    const { valueColumn, aggregation = 'count', groupByColumn, targetValue } = config

    let val: number
    if (aggregation === 'count') {
      if (groupByColumn) {
        // Count distinct values in group column
        const unique = new Set(rows.map((r) => String(r[groupByColumn] ?? '')))
        val = unique.size
      } else {
        val = rows.length
      }
    } else if (valueColumn) {
      const nums = rows.map((r) => Number(r[valueColumn]) || 0)
      if (aggregation === 'sum') {
        val = nums.reduce((a, b) => a + b, 0)
      } else {
        val = nums.length > 0
          ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
          : 0
      }
    } else {
      val = rows.length
    }

    const pct = targetValue && targetValue > 0
      ? Math.round((val / targetValue) * 100)
      : null

    const lbl = valueColumn
      ? `${aggregation === 'average' ? 'Avg' : aggregation === 'sum' ? 'Total' : 'Count'} of ${valueColumn}`
      : groupByColumn
        ? `Unique ${groupByColumn}`
        : 'Total Rows'

    return { value: val, label: lbl, percentage: pct }
  }, [config, rows])

  const color = percentage !== null
    ? percentage >= 100
      ? 'text-green-600'
      : percentage >= 70
        ? 'text-yellow-600'
        : 'text-red-600'
    : 'text-foreground'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
      <span className={`text-4xl font-bold ${color}`} data-testid="indicator-value">
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
      </span>
      <span className="text-sm text-muted-foreground text-center">{label}</span>
      {percentage !== null && (
        <div className="w-full max-w-[200px]">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{percentage}%</span>
            <span>Target: {config.targetValue}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 100 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
