/**
 * Performance Load Testing
 * Tests system performance under load
 */

interface LoadTestConfig {
  baseURL: string
  concurrentUsers: number
  duration: number // seconds
  rampUpTime: number // seconds
  scenarios: LoadTestScenario[]
}

interface LoadTestScenario {
  name: string
  weight: number // Percentage of traffic
  requests: RequestConfig[]
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  body?: any
  headers?: Record<string, string>
  expectedStatus?: number
}

interface LoadTestResults {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
  errors: Array<{ endpoint: string; error: string; count: number }>
}

export class LoadTester {
  private results: number[] = []
  private errors: Map<string, number> = new Map()

  /**
   * Run load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResults> {
    console.log(`Starting load test with ${config.concurrentUsers} concurrent users for ${config.duration}s`)

    const startTime = Date.now()
    const endTime = startTime + config.duration * 1000
    const requests: Promise<void>[] = []

    // Ramp up users gradually
    const usersPerStep = Math.ceil(config.concurrentUsers / (config.rampUpTime / 5))
    
    for (let i = 0; i < config.concurrentUsers; i++) {
      const delay = (i / config.concurrentUsers) * config.rampUpTime * 1000
      
      requests.push(
        new Promise(async (resolve) => {
          await this.sleep(delay)
          await this.simulateUser(config, endTime)
          resolve()
        })
      )
    }

    // Wait for all users to complete
    await Promise.all(requests)

    return this.calculateResults(config.duration)
  }

  /**
   * Simulate single user session
   */
  private async simulateUser(config: LoadTestConfig, endTime: number): Promise<void> {
    while (Date.now() < endTime) {
      // Select random scenario based on weight
      const scenario = this.selectScenario(config.scenarios)
      
      // Execute requests in scenario
      for (const request of scenario.requests) {
        const startTime = Date.now()
        
        try {
          const response = await fetch(`${config.baseURL}${request.endpoint}`, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              ...request.headers
            },
            body: request.body ? JSON.stringify(request.body) : undefined
          })

          const responseTime = Date.now() - startTime
          this.results.push(responseTime)

          if (request.expectedStatus && response.status !== request.expectedStatus) {
            this.recordError(request.endpoint, `Expected ${request.expectedStatus}, got ${response.status}`)
          }
        } catch (error: any) {
          const responseTime = Date.now() - startTime
          this.results.push(responseTime)
          this.recordError(request.endpoint, error.message)
        }

        // Random think time between requests (1-3 seconds)
        await this.sleep(1000 + Math.random() * 2000)
      }
    }
  }

  /**
   * Select scenario based on weight
   */
  private selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
    const random = Math.random() * 100
    let cumulative = 0

    for (const scenario of scenarios) {
      cumulative += scenario.weight
      if (random <= cumulative) {
        return scenario
      }
    }

    return scenarios[0]
  }

  /**
   * Calculate test results
   */
  private calculateResults(duration: number): LoadTestResults {
    const sorted = this.results.sort((a, b) => a - b)
    const totalRequests = this.results.length
    const failedRequests = Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0)
    const successfulRequests = totalRequests - failedRequests

    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: sorted.reduce((sum, time) => sum + time, 0) / sorted.length,
      minResponseTime: sorted[0] || 0,
      maxResponseTime: sorted[sorted.length - 1] || 0,
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
      requestsPerSecond: totalRequests / duration,
      errorRate: (failedRequests / totalRequests) * 100,
      errors: Array.from(this.errors.entries()).map(([endpoint, count]) => ({
        endpoint,
        error: endpoint,
        count
      }))
    }
  }

  /**
   * Record error
   */
  private recordError(endpoint: string, error: string): void {
    const key = `${endpoint}: ${error}`
    this.errors.set(key, (this.errors.get(key) || 0) + 1)
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Print results
   */
  printResults(results: LoadTestResults): void {
    console.log('\n=== Load Test Results ===')
    console.log(`Total Requests: ${results.totalRequests}`)
    console.log(`Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)`)
    console.log(`Failed: ${results.failedRequests} (${results.errorRate.toFixed(2)}%)`)
    console.log(`\nResponse Times (ms):`)
    console.log(`  Average: ${results.averageResponseTime.toFixed(2)}`)
    console.log(`  Min: ${results.minResponseTime}`)
    console.log(`  Max: ${results.maxResponseTime}`)
    console.log(`  P95: ${results.p95ResponseTime}`)
    console.log(`  P99: ${results.p99ResponseTime}`)
    console.log(`\nThroughput: ${results.requestsPerSecond.toFixed(2)} req/s`)
    
    if (results.errors.length > 0) {
      console.log(`\nErrors:`)
      results.errors.forEach(error => {
        console.log(`  ${error.endpoint}: ${error.count} occurrences`)
      })
    }
  }
}

// Example load test configuration
export const DEFAULT_LOAD_TEST: LoadTestConfig = {
  baseURL: 'http://localhost:3000',
  concurrentUsers: 50,
  duration: 60, // 1 minute
  rampUpTime: 10, // 10 seconds
  scenarios: [
    {
      name: 'Browse Dashboard',
      weight: 40,
      requests: [
        {
          method: 'GET',
          endpoint: '/api/incidents',
          expectedStatus: 200
        },
        {
          method: 'GET',
          endpoint: '/api/events/current',
          expectedStatus: 200
        }
      ]
    },
    {
      name: 'Create Incident',
      weight: 30,
      requests: [
        {
          method: 'POST',
          endpoint: '/api/incidents/create',
          body: {
            incident_type: 'Medical',
            occurrence: 'Load test incident',
            action_taken: 'Test action',
            priority: 'medium'
          },
          expectedStatus: 200
        }
      ]
    },
    {
      name: 'View Analytics',
      weight: 20,
      requests: [
        {
          method: 'GET',
          endpoint: '/api/analytics/summary',
          expectedStatus: 200
        }
      ]
    },
    {
      name: 'Update Incident',
      weight: 10,
      requests: [
        {
          method: 'PUT',
          endpoint: '/api/incidents/update',
          body: {
            id: 'test-id',
            is_closed: true
          },
          expectedStatus: 200
        }
      ]
    }
  ]
}

// Run load test if executed directly
if (require.main === module) {
  const tester = new LoadTester()
  tester.runLoadTest(DEFAULT_LOAD_TEST).then(results => {
    tester.printResults(results)
    process.exit(results.errorRate > 5 ? 1 : 0)
  })
}
