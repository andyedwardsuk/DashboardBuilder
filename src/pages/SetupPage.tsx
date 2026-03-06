import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { sampleColumns, sampleRows } from '@/data/fakeData'
import type { ColumnConfig, ColumnType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, Database, ArrowRight, Check } from 'lucide-react'

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'short-text', label: 'Short Text' },
  { value: 'free-text', label: 'Free Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'multi-select', label: 'Multi-Select' },
]

export default function SetupPage() {
  const { state, dispatch } = useData()
  const navigate = useNavigate()
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [step, setStep] = useState<'import' | 'configure'>(
    state.dataSet ? 'configure' : 'import'
  )

  const columns = state.dataSet?.columns ?? []
  const rows = state.dataSet?.rows ?? []
  const keyColumn = state.dataSet?.keyColumn ?? ''

  function loadSampleData() {
    dispatch({
      type: 'SET_DATASET',
      payload: {
        columns: sampleColumns,
        rows: sampleRows,
        keyColumn: 'ID',
      },
    })
    setStep('configure')
  }

  function handleParseJson() {
    try {
      setParseError('')
      const parsed = JSON.parse(jsonInput)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setParseError('JSON must be a non-empty array of objects.')
        return
      }
      const firstRow = parsed[0] as Record<string, unknown>
      const colNames = Object.keys(firstRow)
      const inferredColumns: ColumnConfig[] = colNames.map((name) => {
        const sampleVal = firstRow[name]
        let type: ColumnType = 'text'
        if (typeof sampleVal === 'number') type = 'number'
        else if (typeof sampleVal === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(sampleVal)) type = 'date'
          else if (sampleVal.length > 100) type = 'free-text'
          else if (sampleVal.length <= 30) type = 'short-text'
        }
        return { name, type, isKey: false }
      })
      // Default first column as key
      if (inferredColumns.length > 0) inferredColumns[0].isKey = true

      dispatch({
        type: 'SET_DATASET',
        payload: {
          columns: inferredColumns,
          rows: parsed as Record<string, unknown>[],
          keyColumn: inferredColumns[0]?.name ?? '',
        },
      })
      setStep('configure')
    } catch {
      setParseError('Invalid JSON. Please check your input.')
    }
  }

  function handleColumnTypeChange(colName: string, newType: ColumnType) {
    const updated = columns.map((c) =>
      c.name === colName ? { ...c, type: newType } : c
    )
    dispatch({ type: 'UPDATE_COLUMNS', payload: updated })
  }

  function handleKeyChange(colName: string) {
    dispatch({ type: 'SET_KEY_COLUMN', payload: colName })
  }

  function handleProceed() {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard Builder</h1>
          <div className="flex items-center gap-2">
            <Badge variant={step === 'import' ? 'default' : 'secondary'}>1. Import</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant={step === 'configure' ? 'default' : 'secondary'}>2. Configure</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">3. Dashboard</Badge>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {step === 'import' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Load Sample Data
                </CardTitle>
                <CardDescription>
                  Load a pre-built project management dataset with 50 rows and 11 columns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadSampleData} className="w-full" data-testid="load-sample">
                  <Database className="mr-2 h-4 w-4" />
                  Load Sample Dataset
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Paste JSON Data
                </CardTitle>
                <CardDescription>
                  Paste an array of JSON objects (e.g. exported from Google Sheets).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder='[{"ID": 1, "Name": "Task 1", ...}]'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={6}
                  data-testid="json-input"
                />
                {parseError && (
                  <p className="text-sm text-destructive">{parseError}</p>
                )}
                <Button
                  onClick={handleParseJson}
                  variant="outline"
                  className="w-full"
                  disabled={!jsonInput.trim()}
                  data-testid="parse-json"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Parse & Import
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'configure' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Column Configuration</CardTitle>
                <CardDescription>
                  Configure the type for each column and select the unique key column.
                  {rows.length > 0 && (
                    <span className="ml-1 font-medium">
                      ({rows.length} rows, {columns.length} columns loaded)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_200px_100px] gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                    <span>Column Name</span>
                    <span>Type</span>
                    <span>Key</span>
                  </div>
                  {columns.map((col) => (
                    <div
                      key={col.name}
                      className="grid grid-cols-[1fr_200px_100px] gap-4 items-center"
                      data-testid={`column-row-${col.name}`}
                    >
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{col.name}</Label>
                        {rows.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            e.g. {String(rows[0][col.name] ?? '').substring(0, 40)}
                          </span>
                        )}
                      </div>
                      <Select
                        value={col.type}
                        onValueChange={(val) =>
                          handleColumnTypeChange(col.name, val as ColumnType)
                        }
                      >
                        <SelectTrigger data-testid={`type-select-${col.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMN_TYPES.map((ct) => (
                            <SelectItem key={ct.value} value={ct.value}>
                              {ct.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={col.isKey ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleKeyChange(col.name)}
                        data-testid={`key-btn-${col.name}`}
                      >
                        {col.isKey && <Check className="mr-1 h-3 w-3" />}
                        {col.isKey ? 'Key' : 'Set Key'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>First 10 rows of your dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {columns.map((col) => (
                          <th
                            key={col.name}
                            className="text-left p-2 font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col.name}
                            {col.isKey && (
                              <Badge variant="outline" className="ml-1 text-[10px]">
                                KEY
                              </Badge>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {columns.map((col) => (
                            <td key={col.name} className="p-2 whitespace-nowrap max-w-[200px] truncate">
                              {String(row[col.name] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('import')}>
                Back to Import
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!keyColumn}
                data-testid="proceed-dashboard"
              >
                Proceed to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
