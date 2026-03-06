import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
  accentColor?: string
}

/** Truncate an ISO date string to the start of a period */
function truncateDate(dateStr: string, aggregation: 'day' | 'week' | 'month'): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  if (aggregation === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  if (aggregation === 'week') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    return monday.toISOString().split('T')[0]
  }
  return d.toISOString().split('T')[0]
}

/** Build standard grouped line chart data */
function buildStandardData(
  config: WidgetConfig,
  rows: Record<string, unknown>[],
) {
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
}

/** Build S-curve data with 3 lines: Planned, Actual, Forecast */
function buildSCurveData(
  config: WidgetConfig,
  rows: Record<string, unknown>[],
) {
  const {
    plannedDateColumn,
    actualDateColumn,
    forecastDateColumn,
    valueColumn,
    dateAggregation = 'week',
    displayMode = 'accumulated',
  } = config

  if (!plannedDateColumn) return []

  // Collect all dates to build a timeline
  const allDates = new Set<string>()
  for (const row of rows) {
    for (const col of [plannedDateColumn, actualDateColumn, forecastDateColumn]) {
      if (!col) continue
      const raw = String(row[col] ?? '')
      if (!raw) continue
      const truncated = truncateDate(raw, dateAggregation)
      if (truncated) allDates.add(truncated)
    }
  }
  const timeline = [...allDates].sort()
  if (timeline.length === 0) return []

  const getVal = (row: Record<string, unknown>) =>
    valueColumn ? (Number(row[valueColumn]) || 0) : 1

  const totalValue = rows.reduce((s, r) => s + getVal(r), 0)

  function accumulate(col: string | undefined): Record<string, number> {
    const buckets: Record<string, number> = {}
    if (!col) return buckets
    for (const row of rows) {
      const raw = String(row[col] ?? '')
      if (!raw) continue
      const key = truncateDate(raw, dateAggregation)
      if (!key) continue
      buckets[key] = (buckets[key] ?? 0) + getVal(row)
    }
    return buckets
  }

  const plannedBuckets = accumulate(plannedDateColumn)
  const actualBuckets = accumulate(actualDateColumn)
  const forecastBuckets = accumulate(forecastDateColumn)

  let cumPlanned = 0
  let cumActual = 0
  let cumForecast = 0

  return timeline.map((date) => {
    cumPlanned += plannedBuckets[date] ?? 0
    cumActual += actualBuckets[date] ?? 0
    cumForecast += forecastBuckets[date] ?? 0

    if (displayMode === 'remaining') {
      return {
        name: date,
        Planned: totalValue - cumPlanned,
        Actual: totalValue - cumActual,
        Forecast: totalValue - cumForecast,
      }
    }
    return {
      name: date,
      Planned: cumPlanned,
      Actual: cumActual,
      Forecast: cumForecast,
    }
  })
}

export default function LineChartWidget({ config, rows, accentColor }: Props) {
  const chartMode = config.chartMode ?? 'standard'

  const standardData = useMemo(() => {
    if (chartMode !== 'standard') return []
    return buildStandardData(config, rows)
  }, [config, rows, chartMode])

  const scurveData = useMemo(() => {
    if (chartMode !== 'scurve') return []
    return buildSCurveData(config, rows)
  }, [config, rows, chartMode])

  if (chartMode === 'standard' && !config.groupByColumn) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Configure a group-by column</div>
  }

  if (chartMode === 'scurve' && !config.plannedDateColumn) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Configure planned date column for S-curve</div>
  }

  if (chartMode === 'standard') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={standardData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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

  // S-curve mode: 3 lines
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={scurveData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Planned"
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Planned"
        />
        <Line
          type="monotone"
          dataKey="Actual"
          stroke={accentColor ?? '#3b82f6'}
          strokeWidth={2}
          dot={{ r: 2 }}
          name="Actual"
        />
        <Line
          type="monotone"
          dataKey="Forecast"
          stroke="#f97316"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
          name="Forecast"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
