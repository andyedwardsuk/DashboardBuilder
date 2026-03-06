import { useState } from 'react'
import type { WidgetType, WidgetConfig, ColumnConfig, Widget, AccentColor, TitleFontSize, LineChartMode, DateAggregation, DisplayMode, BurndownMode } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PieChart, TrendingUp, TrendingDown, Gauge, Type } from 'lucide-react'

const WIDGET_TYPES: { value: WidgetType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'pie', label: 'Pie Chart', icon: <PieChart className="h-5 w-5" />, description: 'Show data distribution' },
  { value: 'line', label: 'Line Chart', icon: <TrendingUp className="h-5 w-5" />, description: 'Show trends over categories' },
  { value: 'burndown', label: 'Burn Down', icon: <TrendingDown className="h-5 w-5" />, description: 'Track progress over time' },
  { value: 'indicator', label: 'Indicator', icon: <Gauge className="h-5 w-5" />, description: 'Show a KPI metric' },
  { value: 'freetext', label: 'Free Text', icon: <Type className="h-5 w-5" />, description: 'Add notes or labels' },
]

const ACCENT_COLORS: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'grey', label: 'Grey', hex: '#6b7280' },
]

const FONT_SIZES: { value: TitleFontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig[]
  onAdd: (type: WidgetType, title: string, config: WidgetConfig) => void
  /** When set, the dialog opens in edit mode with pre-populated values */
  editWidget?: Widget | null
  onEdit?: (widget: Widget) => void
}

function AddWidgetDialogInner({ open, onOpenChange, columns, onAdd, editWidget, onEdit }: Props) {
  const isEditing = !!editWidget
  const [step, setStep] = useState<'type' | 'config'>(editWidget ? 'config' : 'type')
  const [selectedType, setSelectedType] = useState<WidgetType | null>(editWidget?.type ?? null)
  const [title, setTitle] = useState(editWidget?.title ?? '')
  const [config, setConfig] = useState<WidgetConfig>(editWidget ? { ...editWidget.config } : {})

  function reset() {
    setStep('type')
    setSelectedType(null)
    setTitle('')
    setConfig({})
  }

  function handleSelectType(type: WidgetType) {
    setSelectedType(type)
    setTitle(WIDGET_TYPES.find((w) => w.value === type)?.label ?? '')
    setStep('config')
  }

  function handleSubmit() {
    if (!selectedType || !title) return
    if (isEditing && editWidget && onEdit) {
      onEdit({
        ...editWidget,
        title,
        config,
      })
    } else {
      onAdd(selectedType, title, config)
    }
    reset()
    onOpenChange(false)
  }

  function handleCancel() {
    reset()
    onOpenChange(false)
  }

  const numberColumns = columns.filter((c) => c.type === 'number' && !c.isKey)
  const dateColumns = columns.filter((c) => c.type === 'date')
  const categoricalColumns = columns.filter((c) =>
    ['select', 'multi-select', 'short-text', 'text'].includes(c.type)
  )

  const appearance = config.appearance ?? {}
  function setAppearance(patch: Partial<typeof appearance>) {
    setConfig((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...patch },
    }))
  }

  const showValueColumn = selectedType === 'pie' || selectedType === 'line' || selectedType === 'indicator' || selectedType === 'burndown'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); else onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'type'
              ? 'Add Widget'
              : isEditing
                ? `Edit ${WIDGET_TYPES.find((w) => w.value === selectedType)?.label}`
                : `Configure ${WIDGET_TYPES.find((w) => w.value === selectedType)?.label}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' ? 'Choose a widget type to add to your dashboard.' : 'Set up the widget configuration.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && (
          <div className="grid grid-cols-2 gap-3 py-4" data-testid="widget-type-grid">
            {WIDGET_TYPES.map((wt) => (
              <button
                key={wt.value}
                onClick={() => handleSelectType(wt.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid={`widget-type-${wt.value}`}
              >
                {wt.icon}
                <span className="font-medium text-sm">{wt.label}</span>
                <span className="text-xs text-muted-foreground text-center">{wt.description}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'config' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget title"
                data-testid="widget-title-input"
              />
            </div>

            {selectedType === 'line' && (
              <div className="space-y-2">
                <Label>Chart Mode</Label>
                <Select
                  value={config.chartMode ?? 'standard'}
                  onValueChange={(v) => setConfig({ ...config, chartMode: v as LineChartMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="scurve">S-Curve (Planned / Actual / Forecast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedType === 'pie' || (selectedType === 'line' && (config.chartMode ?? 'standard') === 'standard')) && (
              <>
                <div className="space-y-2">
                  <Label>Group By Column</Label>
                  <Select
                    value={config.groupByColumn ?? ''}
                    onValueChange={(v) => setConfig({ ...config, groupByColumn: v })}
                  >
                    <SelectTrigger data-testid="group-by-select">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aggregation</Label>
                  <Select
                    value={config.aggregation ?? 'count'}
                    onValueChange={(v) => setConfig({ ...config, aggregation: v as WidgetConfig['aggregation'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* S-curve date columns and options */}
            {selectedType === 'line' && config.chartMode === 'scurve' && (
              <>
                <div className="space-y-2">
                  <Label>Planned Date Column</Label>
                  <Select
                    value={config.plannedDateColumn ?? ''}
                    onValueChange={(v) => setConfig({ ...config, plannedDateColumn: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dateColumns.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Actual Date Column</Label>
                  <Select
                    value={config.actualDateColumn ?? ''}
                    onValueChange={(v) => setConfig({ ...config, actualDateColumn: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dateColumns.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forecast Date Column</Label>
                  <Select
                    value={config.forecastDateColumn ?? ''}
                    onValueChange={(v) => setConfig({ ...config, forecastDateColumn: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dateColumns.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Aggregation</Label>
                  <Select
                    value={config.dateAggregation ?? 'week'}
                    onValueChange={(v) => setConfig({ ...config, dateAggregation: v as DateAggregation })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Mode</Label>
                  <Select
                    value={config.displayMode ?? 'accumulated'}
                    onValueChange={(v) => setConfig({ ...config, displayMode: v as DisplayMode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accumulated">Accumulated Total</SelectItem>
                      <SelectItem value="remaining">Remaining Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedType === 'indicator' && (
              <div className="space-y-2">
                <Label>Aggregation</Label>
                <Select
                  value={config.aggregation ?? 'count'}
                  onValueChange={(v) => setConfig({ ...config, aggregation: v as WidgetConfig['aggregation'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Value Column — always visible for pie, line, indicator */}
            {showValueColumn && (
              <div className="space-y-2">
                <Label>Value Column</Label>
                <Select
                  value={config.valueColumn ?? ''}
                  onValueChange={(v) => setConfig({ ...config, valueColumn: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {numberColumns.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType === 'burndown' ? (
                  <p className="text-xs text-muted-foreground">
                    Optional. When set, uses the numeric value per row instead of counting rows.
                  </p>
                ) : (config.aggregation ?? 'count') === 'count' ? (
                  <p className="text-xs text-muted-foreground">
                    Value column is ignored when aggregation is Count.
                  </p>
                ) : null}
              </div>
            )}

            {selectedType === 'indicator' && (
              <div className="space-y-2">
                <Label>Target Value (optional)</Label>
                <Input
                  type="number"
                  value={config.targetValue ?? ''}
                  onChange={(e) => setConfig({ ...config, targetValue: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 100"
                />
              </div>
            )}

            {selectedType === 'burndown' && (
              <>
                <div className="space-y-2">
                  <Label>Burndown Mode</Label>
                  <Select
                    value={config.burndownMode ?? 'dates'}
                    onValueChange={(v) => setConfig({ ...config, burndownMode: v as BurndownMode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dates">Date-based (Planned / Actual / Forecast)</SelectItem>
                      <SelectItem value="status">Status-based (legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(config.burndownMode ?? 'dates') === 'dates' && (
                  <>
                    <div className="space-y-2">
                      <Label>Planned Date Column</Label>
                      <Select
                        value={config.plannedDateColumn ?? ''}
                        onValueChange={(v) => setConfig({ ...config, plannedDateColumn: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dateColumns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Actual Date Column</Label>
                      <Select
                        value={config.actualDateColumn ?? ''}
                        onValueChange={(v) => setConfig({ ...config, actualDateColumn: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dateColumns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Forecast Date Column</Label>
                      <Select
                        value={config.forecastDateColumn ?? ''}
                        onValueChange={(v) => setConfig({ ...config, forecastDateColumn: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dateColumns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {config.burndownMode === 'status' && (
                  <>
                    <div className="space-y-2">
                      <Label>Date Column</Label>
                      <Select
                        value={config.dateColumn ?? ''}
                        onValueChange={(v) => setConfig({ ...config, dateColumn: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dateColumns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status Column</Label>
                      <Select
                        value={config.statusColumn ?? ''}
                        onValueChange={(v) => setConfig({ ...config, statusColumn: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categoricalColumns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Completed Status Value</Label>
                      <Input
                        value={config.completedValue ?? 'Done'}
                        onChange={(e) => setConfig({ ...config, completedValue: e.target.value })}
                        placeholder="e.g. Done"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {selectedType === 'freetext' && (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={config.textContent ?? ''}
                  onChange={(e) => setConfig({ ...config, textContent: e.target.value })}
                  placeholder="Enter your text here..."
                  rows={4}
                  data-testid="freetext-input"
                />
              </div>
            )}

            {/* Appearance section */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-semibold">Appearance</Label>

              <div className="space-y-2">
                <Label className="text-sm">Title Font Size</Label>
                <Select
                  value={appearance.titleFontSize ?? 'medium'}
                  onValueChange={(v) => setAppearance({ titleFontSize: v as TitleFontSize })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((fs) => (
                      <SelectItem key={fs.value} value={fs.value}>{fs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Accent Colour</Label>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map((ac) => (
                    <button
                      key={ac.value}
                      onClick={() => setAppearance({ accentColor: ac.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        (appearance.accentColor ?? 'blue') === ac.value
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      style={{ backgroundColor: ac.hex }}
                      title={ac.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Show Title</Label>
                <Switch
                  checked={appearance.showTitle !== false}
                  onCheckedChange={(checked) => setAppearance({ showTitle: checked })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'config' && (
          <DialogFooter>
            {!isEditing && (
              <Button variant="outline" onClick={() => setStep('type')}>Back</Button>
            )}
            <Button onClick={handleSubmit} disabled={!title} data-testid="add-widget-confirm">
              {isEditing ? 'Save Changes' : 'Add Widget'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Wrapper that remounts the inner dialog when editWidget changes,
 * ensuring fresh state without useEffect + setState.
 */
export default function AddWidgetDialog(props: Props) {
  return <AddWidgetDialogInner key={props.editWidget?.id ?? '__add__'} {...props} />
}
