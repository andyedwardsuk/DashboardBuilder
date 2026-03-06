import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
  accentColor?: string
}

/** Legacy status-based burndown */
function buildStatusBurndown(
  config: WidgetConfig,
  rows: Record<string, unknown>[],
) {
  const { dateColumn, statusColumn, completedValue = 'Done', valueColumn } = config
  if (!dateColumn || !statusColumn) return []

  const sorted = [...rows].sort((a, b) => {
    const da = String(a[dateColumn] ?? '')
    const db = String(b[dateColumn] ?? '')
    return da.localeCompare(db)
  })

  const totalItems = sorted.length
  const dateMap: Record<string, { completed: number; total: number }> = {}
  let cumulativeCompleted = 0

  const dates = [...new Set(sorted.map((r) => String(r[dateColumn] ?? '')))]
    .filter(Boolean)
    .sort()

  for (const date of dates) {
    const rowsOnDate = sorted.filter((r) => String(r[dateColumn] ?? '') === date)
    for (const row of rowsOnDate) {
      if (String(row[statusColumn]) === completedValue) {
        cumulativeCompleted += valueColumn ? (Number(row[valueColumn]) || 1) : 1
      }
    }
    const totalValue = valueColumn
      ? sorted.reduce((s, r) => s + (Number(r[valueColumn]) || 0), 0)
      : totalItems

    dateMap[date] = {
      completed: cumulativeCompleted,
      total: totalValue,
    }
  }

  return dates.map((date) => ({
    date,
    remaining: dateMap[date].total - dateMap[date].completed,
    ideal: dateMap[date].total * (1 - dates.indexOf(date) / (dates.length - 1 || 1)),
  }))
}

/** Date-based burndown: derives remaining from planned/actual/forecast completion dates */
function buildDateBurndown(
  config: WidgetConfig,
  rows: Record<string, unknown>[],
) {
  const {
    plannedDateColumn,
    actualDateColumn,
    forecastDateColumn,
    valueColumn,
  } = config

  if (!plannedDateColumn) return []

  const getVal = (row: Record<string, unknown>) =>
    valueColumn ? (Number(row[valueColumn]) || 0) : 1

  const totalValue = rows.reduce((s, r) => s + getVal(r), 0)

  // Collect all dates from all 3 columns to build unified timeline
  const allDates = new Set<string>()
  for (const row of rows) {
    for (const col of [plannedDateColumn, actualDateColumn, forecastDateColumn]) {
      if (!col) continue
      const raw = String(row[col] ?? '')
      if (raw) allDates.add(raw)
    }
  }
  const timeline = [...allDates].sort()
  if (timeline.length === 0) return []

  // For each date, compute cumulative completions per line
  function accumulate(col: string | undefined): Record<string, number> {
    const buckets: Record<string, number> = {}
    if (!col) return buckets
    for (const row of rows) {
      const raw = String(row[col] ?? '')
      if (!raw) continue
      buckets[raw] = (buckets[raw] ?? 0) + getVal(row)
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

    return {
      date,
      'Planned Remaining': totalValue - cumPlanned,
      'Actual Remaining': totalValue - cumActual,
      'Forecast Remaining': totalValue - cumForecast,
    }
  })
}

export default function BurnDownWidget({ config, rows, accentColor }: Props) {
  const burndownMode = config.burndownMode ?? (config.statusColumn ? 'status' : 'dates')

  const statusData = useMemo(() => {
    if (burndownMode !== 'status') return []
    return buildStatusBurndown(config, rows)
  }, [config, rows, burndownMode])

  const dateData = useMemo(() => {
    if (burndownMode !== 'dates') return []
    return buildDateBurndown(config, rows)
  }, [config, rows, burndownMode])

  // Legacy mode: need date + status columns
  if (burndownMode === 'status' && (!config.dateColumn || !config.statusColumn)) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Configure date and status columns
      </div>
    )
  }

  // Date mode: need at least planned date column
  if (burndownMode === 'dates' && !config.plannedDateColumn) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Configure planned date column
      </div>
    )
  }

  if (burndownMode === 'status') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={statusData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="remaining" stroke={accentColor ?? '#FF8042'} fill={accentColor ?? '#FF8042'} fillOpacity={0.3} name="Remaining" />
          <Area type="monotone" dataKey="ideal" stroke="#82ca9d" fill="none" strokeDasharray="5 5" name="Ideal" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Date-based burndown: 3 lines
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={dateData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="Planned Remaining"
          stroke="#6b7280"
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Planned"
        />
        <Area
          type="monotone"
          dataKey="Actual Remaining"
          stroke={accentColor ?? '#3b82f6'}
          fill={accentColor ?? '#3b82f6'}
          fillOpacity={0.2}
          strokeWidth={2}
          name="Actual"
        />
        <Area
          type="monotone"
          dataKey="Forecast Remaining"
          stroke="#f97316"
          fill="none"
          strokeWidth={2}
          strokeDasharray="3 3"
          name="Forecast"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
