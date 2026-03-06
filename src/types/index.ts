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
  /** Date column for burndown */
  dateColumn?: string
  /** Target value for indicator */
  targetValue?: number
  /** Free text content (markdown) */
  textContent?: string
  /** Status column for burndown */
  statusColumn?: string
  /** Completed status value for burndown */
  completedValue?: string
  /** Visual appearance settings */
  appearance?: WidgetAppearance
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
