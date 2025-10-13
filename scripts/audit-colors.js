// scripts/audit-colors.js
// Quick color contrast audit for common combinations

const { checkContrast, checkTailwindContrast } = require('../src/utils/colorContrast.ts')

console.log('🎨 Running Color Contrast Audit...\n')

// Test common combinations
const tests = [
  { name: 'Black text on white', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Gray-700 text on white', fg: '#374151', bg: '#FFFFFF' },
  { name: 'Gray-600 text on white', fg: '#4B5563', bg: '#FFFFFF' },
  { name: 'Gray-500 text on white', fg: '#6B7280', bg: '#FFFFFF' },
  { name: 'White text on gray-900', fg: '#FFFFFF', bg: '#111827' },
  { name: 'White text on blue-600', fg: '#FFFFFF', bg: '#2563EB' },
  { name: 'White text on blue-500', fg: '#FFFFFF', bg: '#3B82F6' },
  { name: 'White text on red-600', fg: '#FFFFFF', bg: '#DC2626' },
  { name: 'White text on green-600', fg: '#FFFFFF', bg: '#059669' },
  { name: 'Black text on yellow-500', fg: '#000000', bg: '#F59E0B' },
  { name: 'White text on yellow-500', fg: '#FFFFFF', bg: '#F59E0B' },
]

let passed = 0
let failed = 0

tests.forEach(test => {
  const result = checkContrast(test.fg, test.bg)
  const status = result.passesAA ? '✅ PASS' : '❌ FAIL'
  const level = result.level
  
  console.log(`${status} ${test.name}`)
  console.log(`   Contrast: ${result.ratio}:1 (${level})`)
  console.log(`   Colors: ${test.fg} on ${test.bg}`)
  
  if (result.passesAA) {
    passed++
  } else {
    failed++
    console.log(`   ⚠️  Needs improvement`)
  }
  console.log('')
})

console.log(`📊 Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests`)

if (failed > 0) {
  console.log('\n🔧 Recommendations:')
  console.log('• Gray-500 and lighter grays may need darker backgrounds')
  console.log('• Yellow backgrounds work better with black text')
  console.log('• Consider using larger font sizes for borderline cases')
}
