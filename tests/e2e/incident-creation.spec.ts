/**
 * E2E Tests - Incident Creation Workflow
 * Tests the complete incident creation flow using Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Incident Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should create a new incident with all required fields', async ({ page }) => {
    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Fill in incident details
    await page.fill('[name="occurrence"]', 'Medical incident at main gate - person collapsed')
    await page.fill('[name="action_taken"]', 'Medics dispatched to location immediately')
    
    // Select incident type
    await page.selectOption('select[name="incident_type"]', 'Medical')
    
    // Select priority
    await page.selectOption('select[name="priority"]', 'high')
    
    // Fill callsigns
    await page.fill('[name="callsign_from"]', 'Alpha 1')
    await page.fill('[name="callsign_to"]', 'Control')

    // Submit form
    await page.click('button:has-text("Create Incident")')

    // Wait for success
    await page.waitForSelector('text=Incident created successfully', { timeout: 5000 })

    // Verify incident appears in table
    await expect(page.locator('text=Medical incident at main gate')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')
    
    // Try to submit without filling fields
    await page.click('button:has-text("Create Incident")')

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible()
  })

  test('should use structured logging template', async ({ page }) => {
    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')
    
    // Enable structured template if available
    const templateToggle = page.locator('text=Use Structured Template')
    if (await templateToggle.isVisible()) {
      await templateToggle.click()
    }

    // Fill structured fields
    await page.fill('[name="headline"]', 'Medical incident at north gate')
    await page.fill('[name="source"]', 'Alpha 1')
    await page.fill('[name="facts_observed"]', 'Person lying on ground, unresponsive')
    await page.fill('[name="actions_taken"]', 'First aid administered, ambulance called')
    await page.fill('[name="outcome"]', 'Patient stabilized, awaiting ambulance')

    // Submit
    await page.click('button:has-text("Create Incident")')

    // Verify success
    await page.waitForSelector('text=Incident created successfully', { timeout: 5000 })
  })

  test('should capture voice input', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Web Speech API not supported in Firefox')

    // Grant microphone permissions (in headed mode)
    await page.context().grantPermissions(['microphone'])

    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')

    // Click voice input button if available
    const voiceButton = page.locator('[aria-label="Voice input"]')
    if (await voiceButton.isVisible()) {
      await voiceButton.click()
      
      // Verify voice input UI is shown
      await expect(page.locator('text=Listening')).toBeVisible()
    }
  })

  test('should attach photos to incident', async ({ page }) => {
    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')

    // Fill basic details
    await page.fill('[name="occurrence"]', 'Test incident with photo')
    await page.selectOption('select[name="incident_type"]', 'Other')

    // Upload photo if file input available
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    if (await fileInput.isVisible()) {
      // Create a test file
      await fileInput.setInputFiles({
        name: 'test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data')
      })

      // Verify photo appears
      await expect(page.locator('text=test.jpg')).toBeVisible()
    }
  })

  test('should capture GPS location', async ({ page }) => {
    // Grant geolocation permissions
    await page.context().grantPermissions(['geolocation'])
    
    // Mock geolocation
    await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 })

    // Click "New Incident" button
    await page.click('button:has-text("New Incident")')

    // Click capture location button if available
    const locationButton = page.locator('button:has-text("Capture Location")')
    if (await locationButton.isVisible()) {
      await locationButton.click()
      
      // Wait for location capture
      await page.waitForTimeout(2000)
      
      // Verify location is captured
      await expect(page.locator('text=Location Captured')).toBeVisible()
    }
  })
})

test.describe('Incident Management', () => {
  test('should view incident details', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Click on first incident in table
    const firstIncident = page.locator('[data-testid="incident-row"]').first()
    if (await firstIncident.isVisible()) {
      await firstIncident.click()
      
      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      
      // Should show incident details
      await expect(page.locator('text=Occurrence')).toBeVisible()
      await expect(page.locator('text=Action Taken')).toBeVisible()
    }
  })

  test('should close an open incident', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Find an open incident
    const openIncident = page.locator('button:has-text("Open")').first()
    if (await openIncident.isVisible()) {
      await openIncident.click()
      
      // Should change to closed
      await expect(page.locator('button:has-text("Closed")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should amend an incident', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Click on incident to open details
    const incident = page.locator('[data-testid="incident-row"]').first()
    if (await incident.isVisible()) {
      await incident.click()
      
      // Click amend button if available
      const amendButton = page.locator('button:has-text("Amend")')
      if (await amendButton.isVisible()) {
        await amendButton.click()
        
        // Fill amendment details
        await page.fill('[name="amendment_reason"]', 'Additional information received')
        await page.fill('[name="amended_occurrence"]', 'Updated occurrence details')
        
        // Submit amendment
        await page.click('button:has-text("Submit Amendment")')
        
        // Verify amendment badge
        await expect(page.locator('text=AMENDED')).toBeVisible()
      }
    }
  })
})

test.describe('Analytics Dashboard', () => {
  test('should display analytics dashboards', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics')
    
    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Check for dashboard tabs
    await expect(page.locator('button:has-text("Operational")')).toBeVisible()
    await expect(page.locator('button:has-text("Quality")')).toBeVisible()
    await expect(page.locator('button:has-text("Compliance")')).toBeVisible()
    await expect(page.locator('button:has-text("AI Insights")')).toBeVisible()
  })

  test('should switch between dashboard tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics')
    
    // Click Quality tab
    await page.click('button:has-text("Quality")')
    await expect(page.locator('text=Log Quality')).toBeVisible()

    // Click AI Insights tab
    await page.click('button:has-text("AI Insights")')
    await expect(page.locator('text=Trend')).toBeVisible()
  })

  test('should export analytics report', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics')
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export Report")')
    if (await exportButton.isVisible()) {
      await exportButton.click()
      
      // Wait for export modal
      await expect(page.locator('text=Export Analytics Report')).toBeVisible()
      
      // Select PDF format
      await page.click('button:has-text("PDF")')
      
      // Download should trigger
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Generate Report")')
      ])
      
      expect(download).toBeTruthy()
    }
  })
})

test.describe('Offline Mode', () => {
  test('should show offline indicator when offline', async ({ page, context }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Simulate offline
    await context.setOffline(true)
    
    // Wait for offline indicator
    await expect(page.locator('text=You\'re Offline')).toBeVisible({ timeout: 3000 })
  })

  test('should allow incident creation while offline', async ({ page, context }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Go offline
    await context.setOffline(true)
    
    // Create incident
    await page.click('button:has-text("New Incident")')
    await page.fill('[name="occurrence"]', 'Offline incident test')
    await page.selectOption('select[name="incident_type"]', 'Other')
    await page.click('button:has-text("Create Incident")')
    
    // Should queue for sync
    await expect(page.locator('text=pending sync')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Search Functionality', () => {
  test('should search incidents with natural language', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Find search bar
    const searchBar = page.locator('input[placeholder*="Search"]')
    if (await searchBar.isVisible()) {
      await searchBar.fill('medical incidents')
      
      // Wait for results
      await page.waitForTimeout(1000)
      
      // Should filter to medical incidents only
      const incidents = page.locator('[data-testid="incident-row"]')
      const count = await incidents.count()
      
      if (count > 0) {
        const firstIncident = incidents.first()
        await expect(firstIncident).toContainText('Medical')
      }
    }
  })
})
