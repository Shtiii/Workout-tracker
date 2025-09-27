/**
 * End-to-end tests for Analytics page
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase data
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      const mockData = {
        workouts: [
          {
            id: 'workout-1',
            programName: 'Test Program',
            exercises: [
              {
                id: 'exercise-1',
                name: 'Bench Press',
                sets: [
                  {
                    id: 'set-1',
                    weight: 100,
                    reps: 10,
                    completed: true,
                  },
                ],
              },
            ],
            startTime: { toDate: () => new Date('2024-01-01T10:00:00Z') },
            endTime: { toDate: () => new Date('2024-01-01T11:00:00Z') },
            completedAt: { toDate: () => new Date('2024-01-01T11:00:00Z') },
          },
        ],
        programs: [
          {
            id: 'program-1',
            name: 'Test Program',
            description: 'A test program',
          },
        ],
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      })
    })

    // Navigate to analytics page
    await page.goto('/analytics')
  })

  test('should display analytics page with all tabs', async ({ page }) => {
    // Check page title
    await expect(page.getByText('ANALYTICS')).toBeVisible()

    // Check tabs are present
    await expect(page.getByRole('tab', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Progress' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible()
  })

  test('should show calendar view by default', async ({ page }) => {
    // Calendar should be active by default
    await expect(page.getByText('WORKOUT CALENDAR')).toBeVisible()
    
    // Check calendar elements
    await expect(page.getByText('January 2024')).toBeVisible()
    await expect(page.getByText('Mon')).toBeVisible()
    await expect(page.getByText('Tue')).toBeVisible()
    await expect(page.getByText('Wed')).toBeVisible()
    await expect(page.getByText('Thu')).toBeVisible()
    await expect(page.getByText('Fri')).toBeVisible()
    await expect(page.getByText('Sat')).toBeVisible()
    await expect(page.getByText('Sun')).toBeVisible()
  })

  test('should navigate between months in calendar', async ({ page }) => {
    // Click next month button
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page.getByText('February 2024')).toBeVisible()

    // Click previous month button
    await page.getByRole('button', { name: /previous/i }).click()
    await expect(page.getByText('January 2024')).toBeVisible()
  })

  test('should switch to progress view', async ({ page }) => {
    // Click progress tab
    await page.getByRole('tab', { name: 'Progress' }).click()
    
    // Check progress view elements
    await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible()
    await expect(page.getByText('DETAILED PROGRESS')).toBeVisible()
    
    // Check filter controls
    await expect(page.getByLabel('Program')).toBeVisible()
    await expect(page.getByLabel('Exercise')).toBeVisible()
  })

  test('should switch to history view', async ({ page }) => {
    // Click history tab
    await page.getByRole('tab', { name: 'History' }).click()
    
    // Check history view elements
    await expect(page.getByText('WORKOUT HISTORY')).toBeVisible()
    
    // Check workout list
    await expect(page.getByText('Test Program')).toBeVisible()
  })

  test('should filter progress data by program', async ({ page }) => {
    // Switch to progress view
    await page.getByRole('tab', { name: 'Progress' }).click()
    
    // Select program filter
    await page.getByLabel('Program').click()
    await page.getByRole('option', { name: 'Test Program' }).click()
    
    // Check that filter is applied
    await expect(page.getByLabel('Program')).toHaveValue('Test Program')
  })

  test('should filter progress data by exercise', async ({ page }) => {
    // Switch to progress view
    await page.getByRole('tab', { name: 'Progress' }).click()
    
    // Select exercise filter
    await page.getByLabel('Exercise').click()
    await page.getByRole('option', { name: 'Bench Press' }).click()
    
    // Check that filter is applied
    await expect(page.getByLabel('Exercise')).toHaveValue('Bench Press')
  })

  test('should display workout details in history', async ({ page }) => {
    // Switch to history view
    await page.getByRole('tab', { name: 'History' }).click()
    
    // Check workout details
    await expect(page.getByText('Test Program')).toBeVisible()
    await expect(page.getByText('Duration:')).toBeVisible()
    await expect(page.getByText('Exercises:')).toBeVisible()
    await expect(page.getByText('Bench Press')).toBeVisible()
  })

  test('should handle empty data gracefully', async ({ page }) => {
    // Mock empty data
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workouts: [], programs: [] }),
      })
    })

    // Reload page
    await page.reload()
    
    // Check that page still loads
    await expect(page.getByText('ANALYTICS')).toBeVisible()
    
    // Check calendar shows no workouts
    await expect(page.getByText('WORKOUT CALENDAR')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/firestore.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' }),
      })
    })

    // Reload page
    await page.reload()
    
    // Check error handling
    await expect(page.getByText(/failed to load analytics data/i)).toBeVisible()
  })

  test('should maintain tab state when switching', async ({ page }) => {
    // Start with calendar
    await expect(page.getByText('WORKOUT CALENDAR')).toBeVisible()
    
    // Switch to progress
    await page.getByRole('tab', { name: 'Progress' }).click()
    await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible()
    
    // Switch to history
    await page.getByRole('tab', { name: 'History' }).click()
    await expect(page.getByText('WORKOUT HISTORY')).toBeVisible()
    
    // Switch back to progress
    await page.getByRole('tab', { name: 'Progress' }).click()
    await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that page is still functional
    await expect(page.getByText('ANALYTICS')).toBeVisible()
    
    // Check tabs are accessible
    await expect(page.getByRole('tab', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Progress' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible()
    
    // Test tab switching on mobile
    await page.getByRole('tab', { name: 'Progress' }).click()
    await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first tab
    await page.getByRole('tab', { name: 'Calendar' }).focus()
    
    // Use arrow keys to navigate tabs
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Progress' })).toBeFocused()
    
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'History' })).toBeFocused()
    
    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(page.getByText('WORKOUT HISTORY')).toBeVisible()
  })

  test('should handle accessibility features', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true')
    
    // Switch tabs and check ARIA states
    await page.getByRole('tab', { name: 'Progress' }).click()
    await expect(page.getByRole('tab', { name: 'Progress' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'false')
  })

  test('should load data efficiently', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    
    await page.goto('/analytics')
    await expect(page.getByText('ANALYTICS')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle concurrent tab switches', async ({ page }) => {
    // Rapidly switch between tabs
    await page.getByRole('tab', { name: 'Progress' }).click()
    await page.getByRole('tab', { name: 'History' }).click()
    await page.getByRole('tab', { name: 'Calendar' }).click()
    await page.getByRole('tab', { name: 'Progress' }).click()
    
    // Should end up on progress tab
    await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible()
  })
})
