import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
  accentColor?: string
}

export default function LineChartWidget({ config, rows, accentColor }: Props) {
  const data = useMemo(() => {
    const { groupByColumn, valueColumn, aggregation = 'count' } = config
    if (!groupByColumn) return []

    const groups: Record<string, { sum: number; count: number }> = {}
    for (const row of rows) {
      const key = String(row[groupByColumn] ?? 'Unknown')
      if (!groups[key]) groups[key] = { sum: 0, count: 0 }
      groups[key].count += 1
      if (valueColumn) {
        groups[key].sum += Number(row[valueColumn]) || 0
      }
    }

    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    return sorted.map(([name, { sum, count }]) => ({
      name,
      value:
        aggregation === 'count'
          ? count
          : aggregation === 'average'
            ? Math.round((sum / (count || 1)) * 10) / 10
            : sum,
    }))
  }, [config, rows])

  if (!config.groupByColumn) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Configure a group-by column</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke={accentColor ?? '#0088FE'} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
