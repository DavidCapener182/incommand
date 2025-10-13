#!/usr/bin/env node
/**
 * Test artist incident type detection
 */

console.log('🎭 Testing Artist Incident Detection\n')

// Test cases based on how users might log artist incidents
const tests = [
  // Artist On Stage variations
  { input: "artist on stage", expected: "Artist On Stage" },
  { input: "Artist on stage", expected: "Artist On Stage" },
  { input: "on stage", expected: "Artist On Stage" },
  { input: "onstage", expected: "Artist On Stage" },
  { input: "taking stage", expected: "Artist On Stage" },
  { input: "stage now", expected: "Artist On Stage" },
  { input: "performing", expected: "Artist On Stage" },
  { input: "started performing", expected: "Artist On Stage" },
  { input: "band on", expected: "Artist On Stage" },
  { input: "main act started", expected: "Artist On Stage" },
  { input: "Artist is on stage now", expected: "Artist On Stage" },
  { input: "They're on stage", expected: "Artist On Stage" },
  
  // Artist Off Stage variations
  { input: "artist off stage", expected: "Artist Off Stage" },
  { input: "off stage", expected: "Artist Off Stage" },
  { input: "offstage", expected: "Artist Off Stage" },
  { input: "left stage", expected: "Artist Off Stage" },
  { input: "finished performing", expected: "Artist Off Stage" },
  { input: "band off", expected: "Artist Off Stage" },
  { input: "set finished", expected: "Artist Off Stage" },
  { input: "main act finished", expected: "Artist Off Stage" },
  { input: "performance ended", expected: "Artist Off Stage" },
]

let passed = 0
let failed = 0

tests.forEach(test => {
  const lower = test.input.toLowerCase()
  let detected = ''
  
  // Artist On Stage detection
  const onStageKeywords = [
    'artist on stage', 'main act started', 'on stage', 'onstage', 
    'taking stage', 'stage now', 'performing', 'started performing', 'band on'
  ]
  
  if (onStageKeywords.some(keyword => lower.includes(keyword))) {
    detected = 'Artist On Stage'
  }
  
  // Artist Off Stage detection
  const offStageKeywords = [
    'artist off stage', 'main act finished', 'off stage', 'offstage',
    'left stage', 'finished performing', 'band off', 'set finished', 'performance ended'
  ]
  
  if (offStageKeywords.some(keyword => lower.includes(keyword))) {
    detected = 'Artist Off Stage'
  }
  
  const pass = detected === test.expected
  if (pass) passed++
  else failed++
  
  console.log(`${pass ? '✅' : '❌'} "${test.input}"`)
  console.log(`   Expected: ${test.expected}, Got: ${detected || '(none)'}\n`)
})

console.log('═'.repeat(60))
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`Accuracy: ${((passed / tests.length) * 100).toFixed(1)}%`)
console.log('═'.repeat(60))

if (passed === tests.length) {
  console.log('\n✨ All tests passed! Artist detection is working correctly.')
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Check the patterns above.`)
}

