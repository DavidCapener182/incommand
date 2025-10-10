# Predictive Capacity Alerts Tests

This directory contains comprehensive tests for the predictive capacity alerts functionality in the `VenueCapacityWidget` component.

## 🧪 Test Files

### 1. `VenueCapacityWidget.test.tsx` - Comprehensive Unit Tests
- **Purpose**: Tests all aspects of the predictive alerts functionality in isolation
- **Coverage**: Alert analysis, state management, toast integration, error handling, performance
- **Best for**: Development, debugging, and ensuring individual functions work correctly

### 2. `VenueCapacityWidget.integration.test.tsx` - Integration Tests
- **Purpose**: Tests the predictive alerts functionality as part of the complete component
- **Coverage**: End-to-end behavior, real component interactions, data flow
- **Best for**: Ensuring the feature works correctly in the real application context

## 🚀 Running the Tests

### Quick Start
```bash
# Run all predictive alerts tests
./test-predictive-alerts.sh

# Or run manually
npx vitest run src/components/__tests__/VenueCapacityWidget.test.tsx
npx vitest run src/components/__tests__/VenueCapacityWidget.integration.test.tsx
```

### Watch Mode (Development)
```bash
# Run tests in watch mode for development
npx vitest src/components/__tests__/VenueCapacityWidget.test.tsx
```

### Coverage Report
```bash
# Generate coverage report
npx vitest run --coverage src/components/__tests__/VenueCapacityWidget.test.tsx
```

## 📋 Test Coverage

### Alert Analysis Function (`analyzePredictiveCapacityAlerts`)
- ✅ Identifies capacity concerns when predictions exceed 75% threshold
- ✅ Calculates time to capacity accurately
- ✅ Determines appropriate alert severity (warning vs critical)
- ✅ Provides actionable recommendations based on severity level

### Alert Handler Function (`handlePredictiveAlert`)
- ✅ Prevents duplicate alerts using unique identifiers
- ✅ Creates persistent toast notifications (duration: 0)
- ✅ Uses appropriate toast types (warning/error) based on severity
- ✅ Manages alert state lifecycle properly

### State Management
- ✅ Tracks current alert toast ID for cleanup
- ✅ Prevents duplicate alerts for the same prediction
- ✅ Resets alert state when event changes
- ✅ Cleans up resources on component unmount

### Toast Integration
- ✅ Displays toast notifications when alerts are triggered
- ✅ Allows manual closing of toast notifications
- ✅ Integrates with existing toast system seamlessly

### Error Handling
- ✅ Handles database errors gracefully
- ✅ Handles toast creation errors gracefully
- ✅ Continues functioning even when predictions fail

### Performance & Optimization
- ✅ Doesn't trigger alerts unnecessarily
- ✅ Handles rapid data updates efficiently
- ✅ Prevents memory leaks through proper cleanup

## 🔧 Test Scenarios

### 1. **Low Occupancy (No Alerts)**
- Attendance: 100 → 180 (18% of capacity)
- Expected: No alerts triggered
- Status: "Safe"

### 2. **Moderate Occupancy (Warning Alerts)**
- Attendance: 500 → 700 (70% of capacity)
- Expected: Warning alerts possible
- Status: "Moderate"

### 3. **High Occupancy (Critical Alerts)**
- Attendance: 800 → 1000 (100% of capacity)
- Expected: Critical alerts triggered
- Status: "Near Capacity"

### 4. **Concerning Trends (Alert Triggers)**
- Attendance: 600 → 800 (80% of capacity)
- Expected: Warning alert with recommendations
- Message: "Monitor attendance trends closely"

## 🎯 Key Test Assertions

### Alert Analysis
```typescript
// Verify alert analysis function works
const alertDetails = analyzePredictiveCapacityAlerts(predictions, capacity);
expect(alertDetails).toBeTruthy();
expect(alertDetails.severity).toBe('warning' || 'critical');
expect(alertDetails.recommendations).toHaveLength(3);
```

### Toast Display
```typescript
// Verify toast notifications appear
expect(screen.getByTestId('toast-container')).toBeInTheDocument();
expect(screen.getByText(/Capacity Alert/)).toBeInTheDocument();
```

### State Management
```typescript
// Verify alert state is managed correctly
expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
  duration: 0, // Persistent toast
  type: 'warning' || 'error'
}));
```

## 🐛 Troubleshooting

### Common Issues

1. **Tests failing with "Cannot find module" errors**
   - Ensure all dependencies are installed: `npm install`
   - Check that the import paths in tests match your project structure

2. **Mock functions not working as expected**
   - Verify that mocks are properly set up in `beforeEach`
   - Check that mock implementations match the expected function signatures

3. **Async tests timing out**
   - Increase timeout in `waitFor` calls if needed
   - Ensure all async operations are properly awaited

4. **Component not rendering in tests**
   - Check that all required props are provided
   - Verify that mocks for external dependencies are working

### Debug Mode
```bash
# Run tests with verbose output
npx vitest run --reporter=verbose src/components/__tests__/VenueCapacityWidget.test.tsx
```

## 📊 Test Metrics

- **Total Test Cases**: 20+ comprehensive tests
- **Coverage Areas**: Alert analysis, state management, toast integration, error handling
- **Mock Coverage**: Supabase, Toast component, Chart.js, utility functions
- **Edge Cases**: Error scenarios, rapid updates, cleanup, state transitions

## 🔄 Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Predictive Alerts Tests
  run: |
    npm install
    npx vitest run src/components/__tests__/VenueCapacityWidget.test.tsx
    npx vitest run src/components/__tests__/VenueCapacityWidget.integration.test.tsx
```

## 📝 Adding New Tests

When adding new predictive alerts functionality:

1. **Add unit tests** to `VenueCapacityWidget.test.tsx`
2. **Add integration tests** to `VenueCapacityWidget.integration.test.tsx`
3. **Update this README** with new test scenarios
4. **Ensure mocks** cover any new external dependencies

## 🎉 Success Criteria

Tests pass when:
- ✅ All alert analysis scenarios work correctly
- ✅ Toast notifications display and function properly
- ✅ State management prevents duplicates and handles cleanup
- ✅ Error handling works gracefully
- ✅ Performance optimizations function as expected
- ✅ Integration with existing component features works seamlessly

---

**Happy Testing! 🧪✨**
