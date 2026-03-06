import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

/** Generate a palette seeded from the accent colour */
function buildPalette(accent: string): string[] {
  return [accent, ...DEFAULT_COLORS.filter((c) => c !== accent)]
}

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
  accentColor?: string
}

export default function PieChartWidget({ config, rows, accentColor }: Props) {
  const COLORS = accentColor ? buildPalette(accentColor) : DEFAULT_COLORS
  const data = useMemo(() => {
    const { groupByColumn, valueColumn, aggregation = 'count' } = config
    if (!groupByColumn) return []

    const groups: Record<string, number> = {}
    for (const row of rows) {
      const key = String(row[groupByColumn] ?? 'Unknown')
      if (aggregation === 'count') {
        groups[key] = (groups[key] ?? 0) + 1
      } else if (valueColumn) {
        const val = Number(row[valueColumn]) || 0
        if (aggregation === 'sum') {
          groups[key] = (groups[key] ?? 0) + val
        } else if (aggregation === 'average') {
          // store sum and count, compute average after
          groups[key] = (groups[key] ?? 0) + val
        }
      }
    }

    if (aggregation === 'average' && valueColumn) {
      const counts: Record<string, number> = {}
      for (const row of rows) {
        const key = String(row[groupByColumn] ?? 'Unknown')
        counts[key] = (counts[key] ?? 0) + 1
      }
      for (const key of Object.keys(groups)) {
        groups[key] = Math.round((groups[key] / (counts[key] || 1)) * 10) / 10
      }
    }

    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [config, rows])

  if (!config.groupByColumn) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Configure a group-by column</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="70%"
          fill="#8884d8"
          dataKey="value"
          label={(props) => {
            const p = props as unknown as Record<string, unknown>
            const name = String(p.name ?? '')
            const percent = Number(p.percent ?? 0)
            return `${name} ${(percent * 100).toFixed(0)}%`
          }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
