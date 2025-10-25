#!/usr/bin/env ts-node

/**
 * Security audit script for CI/CD
 * Validates security configurations and checks for common vulnerabilities
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🔒 Starting security audit...')

interface SecurityCheck {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
}

const checks: SecurityCheck[] = []

/**
 * Check for exposed service keys
 */
function checkExposedServiceKeys(): SecurityCheck {
  try {
    const result = execSync('grep -r "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" . --exclude-dir=node_modules --exclude-dir=.git || true', { encoding: 'utf8' })
    
    if (result.trim()) {
      return {
        name: 'Service Key Exposure',
        status: 'FAIL',
        message: 'SUPABASE_SERVICE_ROLE_KEY found with NEXT_PUBLIC_ prefix - this exposes server secrets to client!'
      }
    }
    
    return {
      name: 'Service Key Exposure',
      status: 'PASS',
      message: 'No service keys exposed to client bundle'
    }
  } catch (error) {
    return {
      name: 'Service Key Exposure',
      status: 'WARN',
      message: 'Could not check for exposed service keys'
    }
  }
}

/**
 * Check for console.log statements that might leak sensitive data
 */
function checkConsoleLogs(): SecurityCheck {
  try {
    const result = execSync('grep -r "console\\.log.*key\\|console\\.log.*token\\|console\\.log.*secret" src/ --exclude-dir=node_modules || true', { encoding: 'utf8' })
    
    if (result.trim()) {
      return {
        name: 'Sensitive Data Logging',
        status: 'WARN',
        message: 'Potential sensitive data in console.log statements found'
      }
    }
    
    return {
      name: 'Sensitive Data Logging',
      status: 'PASS',
      message: 'No obvious sensitive data in console.log statements'
    }
  } catch (error) {
    return {
      name: 'Sensitive Data Logging',
      status: 'WARN',
      message: 'Could not check console.log statements'
    }
  }
}

/**
 * Check for hardcoded secrets
 */
function checkHardcodedSecrets(): SecurityCheck {
  try {
    const patterns = [
      'sk-', // OpenAI keys
      'pk_', // Stripe keys
      'Bearer ', // Auth tokens
      'eyJ', // JWT tokens
    ]
    
    let foundSecrets = false
    let secretMessage = ''
    
    for (const pattern of patterns) {
      try {
        const result = execSync(`grep -r "${pattern}" src/ --exclude-dir=node_modules || true`, { encoding: 'utf8' })
        if (result.trim()) {
          foundSecrets = true
          secretMessage += `Found potential hardcoded secrets with pattern "${pattern}"\n`
        }
      } catch (error) {
        // Pattern not found, which is good
      }
    }
    
    if (foundSecrets) {
      return {
        name: 'Hardcoded Secrets',
        status: 'FAIL',
        message: secretMessage.trim()
      }
    }
    
    return {
      name: 'Hardcoded Secrets',
      status: 'PASS',
      message: 'No hardcoded secrets detected'
    }
  } catch (error) {
    return {
      name: 'Hardcoded Secrets',
      status: 'WARN',
      message: 'Could not check for hardcoded secrets'
    }
  }
}

/**
 * Check environment variable configuration
 */
function checkEnvConfiguration(): SecurityCheck {
  try {
    if (!existsSync('.env.local') && !existsSync('.env')) {
      return {
        name: 'Environment Configuration',
        status: 'WARN',
        message: 'No .env file found - ensure environment variables are configured'
      }
    }
    
    return {
      name: 'Environment Configuration',
      status: 'PASS',
      message: 'Environment file found'
    }
  } catch (error) {
    return {
      name: 'Environment Configuration',
      status: 'WARN',
      message: 'Could not check environment configuration'
    }
  }
}

/**
 * Check for security headers in middleware
 */
function checkSecurityHeaders(): SecurityCheck {
  try {
    const middlewarePath = 'src/middleware.ts'
    if (!existsSync(middlewarePath)) {
      return {
        name: 'Security Headers',
        status: 'FAIL',
        message: 'Middleware file not found'
      }
    }
    
    const middlewareContent = readFileSync(middlewarePath, 'utf8')
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy',
      'Referrer-Policy'
    ]
    
    const missingHeaders = requiredHeaders.filter(header => 
      !middlewareContent.includes(header)
    )
    
    if (missingHeaders.length > 0) {
      return {
        name: 'Security Headers',
        status: 'FAIL',
        message: `Missing security headers: ${missingHeaders.join(', ')}`
      }
    }
    
    return {
      name: 'Security Headers',
      status: 'PASS',
      message: 'All required security headers configured'
    }
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'WARN',
      message: 'Could not check security headers'
    }
  }
}

/**
 * Check for RLS usage in API routes
 */
function checkRLSUsage(): SecurityCheck {
  try {
    const result = execSync('find src/app/api -name "*.ts" -exec grep -l "createRlsServerClient\\|createMiddlewareClient" {} \\; || true', { encoding: 'utf8' })
    
    if (!result.trim()) {
      return {
        name: 'RLS Implementation',
        status: 'WARN',
        message: 'No RLS client usage found in API routes'
      }
    }
    
    return {
      name: 'RLS Implementation',
      status: 'PASS',
      message: 'RLS client usage found in API routes'
    }
  } catch (error) {
    return {
      name: 'RLS Implementation',
      status: 'WARN',
      message: 'Could not check RLS implementation'
    }
  }
}

// Run all security checks
checks.push(checkExposedServiceKeys())
checks.push(checkConsoleLogs())
checks.push(checkHardcodedSecrets())
checks.push(checkEnvConfiguration())
checks.push(checkSecurityHeaders())
checks.push(checkRLSUsage())

// Display results
console.log('\n📊 Security Audit Results:')
console.log('=' .repeat(50))

let passCount = 0
let failCount = 0
let warnCount = 0

checks.forEach(check => {
  const statusIcon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${statusIcon} ${check.name}: ${check.message}`)
  
  if (check.status === 'PASS') passCount++
  else if (check.status === 'FAIL') failCount++
  else warnCount++
})

console.log('\n📈 Summary:')
console.log(`✅ Passed: ${passCount}`)
console.log(`⚠️  Warnings: ${warnCount}`)
console.log(`❌ Failed: ${failCount}`)

if (failCount > 0) {
  console.log('\n🚨 Security audit failed! Please fix the issues above.')
  process.exit(1)
} else if (warnCount > 0) {
  console.log('\n⚠️  Security audit completed with warnings. Review the issues above.')
  process.exit(0)
} else {
  console.log('\n🎉 Security audit passed! All checks successful.')
  process.exit(0)
}
