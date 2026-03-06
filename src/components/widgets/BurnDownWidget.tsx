import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'

interface Props {
  config: WidgetConfig
  rows: Record<string, unknown>[]
  accentColor?: string
}

export default function BurnDownWidget({ config, rows, accentColor }: Props) {
  const data = useMemo(() => {
    const { dateColumn, statusColumn, completedValue = 'Done', valueColumn } = config
    if (!dateColumn || !statusColumn) return []

    // Sort rows by date
    const sorted = [...rows].sort((a, b) => {
      const da = String(a[dateColumn] ?? '')
      const db = String(b[dateColumn] ?? '')
      return da.localeCompare(db)
    })

    // Group by date and calculate cumulative completed vs total
    const totalItems = sorted.length
    const dateMap: Record<string, { completed: number; total: number }> = {}
    let cumulativeCompleted = 0

    // Get unique dates
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
  }, [config, rows])

  if (!config.dateColumn || !config.statusColumn) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Configure date and status columns
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
