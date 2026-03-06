export type ColumnType = 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'short-text' | 'free-text'

export interface ColumnConfig {
  name: string
  type: ColumnType
  isKey: boolean
  options?: string[]
}

export interface DataSet {
  columns: ColumnConfig[]
  rows: Record<string, unknown>[]
  keyColumn: string
}

export type WidgetType = 'pie' | 'line' | 'burndown' | 'indicator' | 'freetext'

export type TitleFontSize = 'small' | 'medium' | 'large'
export type AccentColor = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'grey'
export type LineChartMode = 'standard' | 'scurve'
export type DateAggregation = 'day' | 'week' | 'month'
export type DisplayMode = 'accumulated' | 'remaining'
export type BurndownMode = 'status' | 'dates'

export interface WidgetAppearance {
  titleFontSize?: TitleFontSize
  accentColor?: AccentColor
  showTitle?: boolean
}

export interface WidgetConfig {
  /** Column to group by (pie, line) */
  groupByColumn?: string
  /** Column for values / aggregation */
  valueColumn?: string
  /** Aggregation method */
  aggregation?: 'count' | 'sum' | 'average'
  /** Date column for burndown (legacy) */
  dateColumn?: string
  /** Target value for indicator */
  targetValue?: number
  /** Free text content (markdown) */
  textContent?: string
  /** Status column for burndown (legacy) */
  statusColumn?: string
  /** Completed status value for burndown (legacy) */
  completedValue?: string
  /** Visual appearance settings */
  appearance?: WidgetAppearance

  // --- Line chart / S-curve ---
  /** Line chart mode: standard grouped chart or S-curve */
  chartMode?: LineChartMode
  /** How to aggregate dates on the X-axis */
  dateAggregation?: DateAggregation
  /** Display accumulated total or remaining value */
  displayMode?: DisplayMode

  // --- Date-based burndown / S-curve columns ---
  /** Column for planned date of completion */
  plannedDateColumn?: string
  /** Column for actual date of completion */
  actualDateColumn?: string
  /** Column for forecast date of completion */
  forecastDateColumn?: string

  // --- Burndown mode ---
  /** Burndown mode: legacy status-based or new date-based */
  burndownMode?: BurndownMode
}

export interface Widget {
  id: string
  type: WidgetType
  title: string
  config: WidgetConfig
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardState {
  dataSet: DataSet | null
  widgets: Widget[]
}
