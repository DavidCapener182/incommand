# inCommand Testing Guide

## Overview

Comprehensive testing strategy for the inCommand platform covering unit tests, integration tests, E2E tests, performance tests, and security audits.

---

## 🧪 **Testing Stack**

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Performance Tests**: Custom load tester
- **Security**: npm audit, Snyk, OWASP ZAP
- **Coverage**: Jest coverage reports

---

## 📦 **Setup**

### **Install Dependencies**

```bash
# Install test dependencies
npm install --save-dev @playwright/test @types/jest jest ts-jest @testing-library/react @testing-library/jest-dom

# Install Playwright browsers
npx playwright install
```

### **Configuration Files**

- `playwright.config.ts` - E2E test configuration
- `jest.config.js` - Unit test configuration
- `tests/setup.ts` - Test environment setup

---

## 🧪 **Unit Tests**

### **Running Unit Tests**

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test semanticSearch.test.ts

# Watch mode
npm test -- --watch
```

### **Writing Unit Tests**

```typescript
// Example: Testing a utility function
import { calculateResponseTime } from '@/lib/utils'

describe('calculateResponseTime', () => {
  it('should calculate time difference in minutes', () => {
    const created = new Date('2024-01-15T14:00:00Z')
    const responded = new Date('2024-01-15T14:15:00Z')
    
    const result = calculateResponseTime(created, responded)
    
    expect(result).toBe(15)
  })

  it('should return 0 for same timestamps', () => {
    const time = new Date()
    const result = calculateResponseTime(time, time)
    expect(result).toBe(0)
  })
})
```

### **Test Coverage Goals**

- **Overall**: > 80%
- **Critical Paths**: > 95%
- **AI Models**: > 70%
- **UI Components**: > 75%

---

## 🌐 **E2E Tests**

### **Running E2E Tests**

```bash
# Run all E2E tests
npx playwright test

# Run specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/e2e/incident-creation.spec.ts
```

### **E2E Test Scenarios**

**Critical User Journeys:**

1. **Incident Creation Flow**
   - Open dashboard
   - Create new incident
   - Fill all required fields
   - Attach photo
   - Capture GPS location
   - Submit incident
   - Verify in incident list

2. **Search & Filter**
   - Search for incidents
   - Apply filters
   - Verify results
   - Clear filters
   - Sort results

3. **Analytics Workflow**
   - Navigate to analytics
   - Switch between dashboards
   - Export report
   - Download PDF
   - Verify data accuracy

4. **Offline Mode**
   - Go offline
   - Create incident
   - Verify queued for sync
   - Go online
   - Verify auto-sync

5. **Voice Input**
   - Grant microphone permission
   - Activate voice input
   - Speak incident details
   - Verify transcription
   - Submit incident

---

## ⚡ **Performance Tests**

### **Running Performance Tests**

```bash
# Run load test
npm run test:performance

# Custom load test
ts-node tests/performance/load-test.ts
```

### **Performance Benchmarks**

**Target Metrics:**

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load Time | < 2s | < 5s |
| API Response (p95) | < 500ms | < 1s |
| API Response (p99) | < 1s | < 2s |
| Time to Interactive | < 3s | < 5s |
| Largest Contentful Paint | < 2.5s | < 4s |

**Load Test Scenarios:**

- **Light Load**: 10 concurrent users
- **Normal Load**: 50 concurrent users
- **Heavy Load**: 200 concurrent users
- **Stress Test**: 500 concurrent users

### **Performance Optimization**

```bash
# Analyze bundle size
npm run analyze

# Check Core Web Vitals
npx lighthouse https://your-domain.com --only-categories=performance

# Profile React components
# Use React DevTools Profiler
```

---

## 🔒 **Security Tests**

### **Running Security Audits**

```bash
# Check npm dependencies
npm audit

# Fix automatically
npm audit fix

# Snyk security scan
npx snyk test

# OWASP dependency check
npm run security:check
```

### **Manual Security Testing**

1. **SQL Injection Testing**
   ```bash
   # Test incident search
   ' OR '1'='1
   '; DROP TABLE incidents; --
   ```

2. **XSS Testing**
   ```bash
   # Test incident occurrence field
   <script>alert('XSS')</script>
   <img src=x onerror="alert('XSS')">
   ```

3. **Authentication Testing**
   - Try accessing protected routes without login
   - Attempt to view other organizations' data
   - Test API without valid API key
   - Try to escalate privileges

4. **File Upload Testing**
   - Upload executable files
   - Upload very large files (>100MB)
   - Upload malicious files
   - Test path traversal in filenames

---

## 📊 **Test Reports**

### **Generating Reports**

```bash
# Generate coverage report
npm test -- --coverage --coverageReporters=html

# View coverage report
open coverage/index.html

# Generate E2E test report
npx playwright show-report

# Generate performance report
npm run test:performance -- --report
```

### **CI/CD Integration**

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx playwright install
      - run: npx playwright test
      - run: npm audit
```

---

## 🎯 **Testing Best Practices**

### **1. Test Organization**

```
tests/
├── unit/
│   ├── lib/
│   │   ├── ai/
│   │   ├── analytics/
│   │   └── utils/
│   └── components/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   ├── critical-paths/
│   ├── features/
│   └── regression/
└── performance/
    ├── load-tests/
    └── stress-tests/
```

### **2. Test Naming Convention**

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    })
  })
})
```

### **3. AAA Pattern**

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const incidents = [/* test data */]
  
  // Act
  const result = calculateTotal(incidents)
  
  // Assert
  expect(result).toBe(42)
})
```

### **4. Mock External Dependencies**

```typescript
// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: mockData,
        error: null
      }))
    }))
  }
}))
```

---

## 🚀 **Continuous Testing**

### **Pre-Commit Hooks**

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

### **Pre-Push Checks**

```bash
#!/bin/bash
# .husky/pre-push

npm test
npm run lint
npm audit
npx playwright test --project=chromium
```

---

## 📈 **Test Metrics to Track**

| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | >80% | TBD |
| E2E Pass Rate | >95% | TBD |
| Performance Score | >90 | TBD |
| Security Score | A | A- |
| Bug Escape Rate | <5% | TBD |
| Mean Time to Fix | <24h | TBD |

---

## 🎓 **Testing Resources**

### **Documentation**
- [Jest Docs](https://jestjs.io/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### **Training**
- Unit testing patterns
- E2E test authoring
- Performance optimization
- Security testing techniques

---

**Last Updated**: January 2024
