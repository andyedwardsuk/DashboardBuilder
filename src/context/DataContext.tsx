import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { DataSet, ColumnConfig, Widget } from '@/types'

interface State {
  dataSet: DataSet | null
  widgets: Widget[]
}

type Action =
  | { type: 'SET_DATASET'; payload: DataSet }
  | { type: 'UPDATE_COLUMNS'; payload: ColumnConfig[] }
  | { type: 'SET_KEY_COLUMN'; payload: string }
  | { type: 'ADD_WIDGET'; payload: Widget }
  | { type: 'UPDATE_WIDGET'; payload: Widget }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'UPDATE_LAYOUTS'; payload: { id: string; layout: Widget['layout'] }[] }
  | { type: 'LOAD_STATE'; payload: State }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATASET':
      return { ...state, dataSet: action.payload }
    case 'UPDATE_COLUMNS':
      if (!state.dataSet) return state
      return { ...state, dataSet: { ...state.dataSet, columns: action.payload } }
    case 'SET_KEY_COLUMN':
      if (!state.dataSet) return state
      return {
        ...state,
        dataSet: {
          ...state.dataSet,
          keyColumn: action.payload,
          columns: state.dataSet.columns.map((c) => ({
            ...c,
            isKey: c.name === action.payload,
          })),
        },
      }
    case 'ADD_WIDGET':
      return { ...state, widgets: [...state.widgets, action.payload] }
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload.id ? action.payload : w
        ),
      }
    case 'REMOVE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter((w) => w.id !== action.payload),
      }
    case 'UPDATE_LAYOUTS':
      return {
        ...state,
        widgets: state.widgets.map((w) => {
          const updated = action.payload.find((l) => l.id === w.id)
          return updated ? { ...w, layout: updated.layout } : w
        }),
      }
    case 'LOAD_STATE':
      return action.payload
    default:
      return state
  }
}

const initialState: State = {
  dataSet: null,
  widgets: [],
}

interface DataContextValue {
  state: State
  dispatch: React.Dispatch<Action>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

const STORAGE_KEY = 'dashboard-builder-state'

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as State
      }
    } catch {
      // ignore
    }
    return initialState
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
