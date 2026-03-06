import type { ColumnConfig } from '@/types'

export const sampleColumns: ColumnConfig[] = [
  { name: 'ID', type: 'number', isKey: true },
  { name: 'Task Name', type: 'text', isKey: false },
  { name: 'Assignee', type: 'short-text', isKey: false },
  { name: 'Status', type: 'multi-select', isKey: false },
  { name: 'Priority', type: 'multi-select', isKey: false },
  { name: 'Category', type: 'multi-select', isKey: false },
  { name: 'Start Date', type: 'date', isKey: false },
  { name: 'Due Date', type: 'date', isKey: false },
  { name: 'Planned Completion', type: 'date', isKey: false },
  { name: 'Actual Completion', type: 'date', isKey: false },
  { name: 'Forecast Completion', type: 'date', isKey: false },
  { name: 'Estimated Hours', type: 'number', isKey: false },
  { name: 'Actual Hours', type: 'number', isKey: false },
  { name: 'Rework Hours', type: 'number', isKey: false },
  { name: 'Description', type: 'free-text', isKey: false },
]

const assignees = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank']
const statuses = ['To Do', 'In Progress', 'In Review', 'Done']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const categories = ['Frontend', 'Backend', 'Design', 'DevOps', 'QA', 'Documentation']
const taskPrefixes = [
  'Implement', 'Fix', 'Update', 'Refactor', 'Design', 'Test',
  'Review', 'Deploy', 'Document', 'Optimize',
]
const taskSuffixes = [
  'login page', 'dashboard API', 'database schema', 'user profile',
  'notification system', 'search feature', 'payment flow', 'analytics module',
  'CI/CD pipeline', 'unit tests', 'responsive layout', 'caching layer',
  'error handling', 'auth middleware', 'data export', 'onboarding flow',
  'permissions system', 'email templates', 'webhook handler', 'rate limiter',
]

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().split('T')[0]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateSampleData(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []
  const startRange = new Date('2025-01-01')

  for (let i = 1; i <= 50; i++) {
    const startDate = randomDate(startRange, new Date('2025-09-01'))
    const start = new Date(startDate)
    const dueDate = new Date(start.getTime() + (7 + Math.floor(Math.random() * 60)) * 86400000)
      .toISOString().split('T')[0]
    const estimated = Math.floor(Math.random() * 40) + 4
    const status = pick(statuses)
    const actual = status === 'Done'
      ? estimated + Math.floor(Math.random() * 10) - 5
      : status === 'In Progress' || status === 'In Review'
        ? Math.floor(estimated * (0.3 + Math.random() * 0.5))
        : 0
    const rework = status === 'Done'
      ? Math.floor(Math.random() * 8)
      : status === 'In Review'
        ? Math.floor(Math.random() * 4)
        : 0

    // Planned completion = due date
    const plannedCompletion = dueDate
    // Actual completion = set for Done items (a few days around due date)
    const actualCompletion = status === 'Done'
      ? new Date(new Date(dueDate).getTime() + (Math.floor(Math.random() * 14) - 5) * 86400000)
          .toISOString().split('T')[0]
      : ''
    // Forecast completion = set for In Progress / In Review items
    const forecastCompletion = status === 'In Progress' || status === 'In Review'
      ? new Date(new Date(dueDate).getTime() + Math.floor(Math.random() * 21) * 86400000)
          .toISOString().split('T')[0]
      : status === 'Done'
        ? actualCompletion
        : ''

    rows.push({
      'ID': i,
      'Task Name': `${pick(taskPrefixes)} ${pick(taskSuffixes)}`,
      'Assignee': pick(assignees),
      'Status': status,
      'Priority': pick(priorities),
      'Category': pick(categories),
      'Start Date': startDate,
      'Due Date': dueDate,
      'Planned Completion': plannedCompletion,
      'Actual Completion': actualCompletion,
      'Forecast Completion': forecastCompletion,
      'Estimated Hours': estimated,
      'Actual Hours': Math.max(0, actual),
      'Rework Hours': rework,
      'Description': `Task #${i} - ${status === 'Done' ? 'Completed' : 'Ongoing'} work item.`,
    })
  }

  return rows
}

export const sampleRows = generateSampleData()
