import { test, expect } from '@playwright/test'

test.describe('Dashboard Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test.describe('Setup Page', () => {
    test('redirects to /setup by default', async ({ page }) => {
      await expect(page).toHaveURL(/\/setup/)
    })

    test('shows import options: sample data and JSON paste', async ({ page }) => {
      await expect(page.getByTestId('load-sample')).toBeVisible()
      await expect(page.getByTestId('json-input')).toBeVisible()
    })

    test('loads sample data and shows column configuration', async ({ page }) => {
      await page.getByTestId('load-sample').click()

      // Should show column configuration
      await expect(page.getByText('Column Configuration')).toBeVisible()
      await expect(page.getByText('50 rows')).toBeVisible()
      await expect(page.getByText('11 columns')).toBeVisible()

      // Should show the data preview
      await expect(page.getByText('Data Preview')).toBeVisible()
    })

    test('can parse custom JSON data', async ({ page }) => {
      const testData = JSON.stringify([
        { id: 1, name: 'Test Task', status: 'Done', hours: 10 },
        { id: 2, name: 'Another Task', status: 'In Progress', hours: 5 },
      ])
      await page.getByTestId('json-input').fill(testData)
      await page.getByTestId('parse-json').click()

      // Should show column configuration
      await expect(page.getByText('Column Configuration')).toBeVisible()
      await expect(page.getByText('2 rows')).toBeVisible()
      await expect(page.getByText('4 columns')).toBeVisible()
    })

    test('shows error for invalid JSON', async ({ page }) => {
      await page.getByTestId('json-input').fill('not valid json')
      await page.getByTestId('parse-json').click()
      await expect(page.getByText('Invalid JSON')).toBeVisible()
    })

    test('can navigate to dashboard after loading data', async ({ page }) => {
      await page.getByTestId('load-sample').click()
      await page.getByTestId('proceed-dashboard').click()
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
      // Load sample data first
      await page.goto('/setup')
      await page.getByTestId('load-sample').click()
      await page.getByTestId('proceed-dashboard').click()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('shows empty dashboard state', async ({ page }) => {
      await expect(page.getByTestId('empty-dashboard')).toBeVisible()
      await expect(page.getByText('Your dashboard is empty')).toBeVisible()
    })

    test('can open the Add Widget dialog', async ({ page }) => {
      await page.getByTestId('add-widget-btn').click()
      await expect(page.getByRole('heading', { name: 'Add Widget' })).toBeVisible()
      await expect(page.getByTestId('widget-type-grid')).toBeVisible()
    })

    test('can add a Pie Chart widget', async ({ page }) => {
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-pie').click()

      // Should show configuration step
      await expect(page.getByTestId('widget-title-input')).toHaveValue('Pie Chart')

      // Select group by column
      await page.getByTestId('group-by-select').click()
      await page.getByRole('option', { name: 'Status' }).click()

      // Add the widget
      await page.getByTestId('add-widget-confirm').click()

      // Widget should appear on dashboard (look inside the widget card, not the dialog)
      await expect(page.locator('[data-testid^="widget-widget"]').getByText('Pie Chart')).toBeVisible()
      // Empty dashboard state should be gone
      await expect(page.getByTestId('empty-dashboard')).not.toBeVisible()
    })

    test('can add an Indicator widget', async ({ page }) => {
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-indicator').click()

      // Default title
      await expect(page.getByTestId('widget-title-input')).toHaveValue('Indicator')

      // Add with count aggregation (default)
      await page.getByTestId('add-widget-confirm').click()

      // Should show the indicator value (50 rows = 50)
      await expect(page.getByTestId('indicator-value')).toBeVisible()
      await expect(page.getByTestId('indicator-value')).toHaveText('50')
    })

    test('can add a Free Text widget', async ({ page }) => {
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-freetext').click()

      await page.getByTestId('freetext-input').fill('Hello Dashboard!')
      await page.getByTestId('add-widget-confirm').click()

      await expect(page.getByTestId('freetext-content')).toHaveText('Hello Dashboard!')
    })

    test('can add a Line Chart widget', async ({ page }) => {
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-line').click()

      await page.getByTestId('group-by-select').click()
      await page.getByRole('option', { name: 'Priority' }).click()

      await page.getByTestId('add-widget-confirm').click()

      await expect(page.locator('[data-testid^="widget-widget"]').getByText('Line Chart')).toBeVisible()
    })

    test('can remove a widget', async ({ page }) => {
      // Add a widget first
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-indicator').click()
      await page.getByTestId('add-widget-confirm').click()

      // Verify it exists
      await expect(page.locator('[data-testid^="widget-widget"]').getByText('Indicator')).toBeVisible()

      // Find and click the remove button (there's only one widget)
      const removeBtn = page.locator('[data-testid^="remove-widget-"]').first()
      await removeBtn.click()

      // Dashboard should be empty again
      await expect(page.getByTestId('empty-dashboard')).toBeVisible()
    })

    test('can add multiple widgets', async ({ page }) => {
      // Add Indicator
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-indicator').click()
      await page.getByTestId('add-widget-confirm').click()

      // Add Free Text
      await page.getByTestId('add-widget-btn').click()
      await page.getByTestId('widget-type-freetext').click()
      await page.getByTestId('freetext-input').fill('Notes go here')
      await page.getByTestId('add-widget-confirm').click()

      // Both should be visible
      await expect(page.locator('[data-testid^="widget-widget"]').getByText('Indicator')).toBeVisible()
      await expect(page.locator('[data-testid^="widget-widget"]').getByText('Free Text')).toBeVisible()
      await expect(page.getByText('Notes go here')).toBeVisible()
    })

    test('can navigate back to settings', async ({ page }) => {
      await page.getByRole('button', { name: /Settings/ }).click()
      await expect(page).toHaveURL(/\/setup/)
    })
  })
})
