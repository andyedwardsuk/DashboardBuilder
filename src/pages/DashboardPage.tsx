import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Responsive, useContainerWidth } from 'react-grid-layout'
import { useData } from '@/context/DataContext'
import type { WidgetType, WidgetConfig, Widget, AccentColor } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import AddWidgetDialog from '@/components/AddWidgetDialog'
import PieChartWidget from '@/components/widgets/PieChartWidget'
import LineChartWidget from '@/components/widgets/LineChartWidget'
import BurnDownWidget from '@/components/widgets/BurnDownWidget'
import IndicatorWidget from '@/components/widgets/IndicatorWidget'
import FreeTextWidget from '@/components/widgets/FreeTextWidget'
import { Plus, Settings, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react'

const ACCENT_HEX: Record<AccentColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  purple: '#a855f7',
  grey: '#6b7280',
}

const TITLE_SIZE_CLASS: Record<string, string> = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
}


interface GridContainerProps {
  gridLayouts: { lg: Array<{ i: string; x: number; y: number; w: number; h: number; minW: number; minH: number }> }
  handleLayoutChange: (layout: ReadonlyArray<{ readonly i: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number }>) => void
  widgets: Widget[]
  handleRemoveWidget: (id: string) => void
  handleEditWidget: (widget: Widget) => void
  renderWidget: (widget: Widget) => React.ReactNode
}

function GridContainer({ gridLayouts, handleLayoutChange, widgets, handleRemoveWidget, handleEditWidget, renderWidget }: GridContainerProps) {
  const { width: containerWidth, containerRef, mounted } = useContainerWidth()

  return (
    <div ref={containerRef}>
      {mounted && containerWidth > 0 && (
        <Responsive
          className="layout"
          width={containerWidth}
          layouts={gridLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ enabled: true, bounded: false, handle: '.drag-handle', threshold: 3 }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
        >
          {widgets.map((widget) => {
            const appearance = widget.config.appearance ?? {}
            const showTitle = appearance.showTitle !== false
            const titleSizeClass = TITLE_SIZE_CLASS[appearance.titleFontSize ?? 'medium'] ?? 'text-sm'
            const accentColor = appearance.accentColor ?? 'blue'
            const accentHex = ACCENT_HEX[accentColor]

            return (
              <div key={widget.id} data-testid={`widget-${widget.id}`}>
                <Card
                  className="h-full flex flex-col overflow-hidden"
                  style={{ borderTopColor: accentHex, borderTopWidth: '3px' }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab drag-handle" />
                      {showTitle && (
                        <CardTitle className={`${titleSizeClass} font-medium`}>{widget.title}</CardTitle>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          data-testid={`widget-menu-${widget.id}`}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditWidget(widget)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveWidget(widget.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-1 p-2 min-h-0">
                    {renderWidget(widget)}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </Responsive>
      )}
    </div>
  )
}

let widgetCounter = 0
function nextId() {
  widgetCounter += 1
  return `widget-${Date.now()}-${widgetCounter}`
}

export default function DashboardPage() {
  const { state, dispatch } = useData()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null)

  const columns = state.dataSet?.columns ?? []
  const rows = state.dataSet?.rows ?? []
  const widgets = state.widgets

  const handleLayoutChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layout: any) => {
      const items = layout as Array<{ i: string; x: number; y: number; w: number; h: number }>
      const updates = items.map((l) => ({
        id: l.i,
        layout: { x: l.x, y: l.y, w: l.w, h: l.h },
      }))
      dispatch({ type: 'UPDATE_LAYOUTS', payload: updates })
    },
    [dispatch]
  )

  if (!state.dataSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Data Loaded</h2>
          <p className="text-muted-foreground">Please set up your data first.</p>
          <Button onClick={() => navigate('/setup')}>Go to Setup</Button>
        </div>
      </div>
    )
  }

  function handleAddWidget(type: WidgetType, title: string, config: WidgetConfig) {
    // Find next available position
    const maxY = widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0)
    const defaultSizes: Record<WidgetType, { w: number; h: number }> = {
      pie: { w: 4, h: 4 },
      line: { w: 6, h: 4 },
      burndown: { w: 6, h: 4 },
      indicator: { w: 3, h: 3 },
      freetext: { w: 4, h: 3 },
    }
    const size = defaultSizes[type] ?? { w: 4, h: 4 }
    const widget: Widget = {
      id: nextId(),
      type,
      title,
      config,
      layout: { x: 0, y: maxY, ...size },
    }
    dispatch({ type: 'ADD_WIDGET', payload: widget })
  }

  function handleRemoveWidget(id: string) {
    dispatch({ type: 'REMOVE_WIDGET', payload: id })
  }

  function handleEditWidget(widget: Widget) {
    setEditingWidget(widget)
  }

  function handleEditSubmit(updated: Widget) {
    dispatch({ type: 'UPDATE_WIDGET', payload: updated })
    setEditingWidget(null)
  }

  const gridLayouts = {
    lg: widgets.map((w) => ({
      i: w.id,
      x: w.layout.x,
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h,
      minW: 2,
      minH: 2,
    })),
  }

  function renderWidget(widget: Widget) {
    const accentHex = ACCENT_HEX[widget.config.appearance?.accentColor ?? 'blue']
    switch (widget.type) {
      case 'pie':
        return <PieChartWidget config={widget.config} rows={rows} accentColor={accentHex} />
      case 'line':
        return <LineChartWidget config={widget.config} rows={rows} accentColor={accentHex} />
      case 'burndown':
        return <BurnDownWidget config={widget.config} rows={rows} accentColor={accentHex} />
      case 'indicator':
        return <IndicatorWidget config={widget.config} rows={rows} accentColor={accentHex} />
      case 'freetext':
        return <FreeTextWidget config={widget.config} />
      default:
        return <div>Unknown widget type</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/setup')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="add-widget-btn">
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4" data-testid="empty-dashboard">
            <div className="rounded-full bg-muted p-6">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Your dashboard is empty</h2>
            <p className="text-muted-foreground max-w-md">
              Click "Add Widget" to start building your dashboard with charts, indicators, and text blocks.
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="add-widget-empty">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Widget
            </Button>
          </div>
        ) : (
          <GridContainer
            gridLayouts={gridLayouts}
            handleLayoutChange={handleLayoutChange}
            widgets={widgets}
            handleRemoveWidget={handleRemoveWidget}
            handleEditWidget={handleEditWidget}
            renderWidget={renderWidget}
          />
        )}
      </main>

      <AddWidgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        columns={columns}
        onAdd={handleAddWidget}
      />

      {/* Edit widget dialog */}
      <AddWidgetDialog
        open={!!editingWidget}
        onOpenChange={(open) => { if (!open) setEditingWidget(null) }}
        columns={columns}
        onAdd={handleAddWidget}
        editWidget={editingWidget}
        onEdit={handleEditSubmit}
      />
    </div>
  )
}
