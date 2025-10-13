#!/usr/bin/env node
/**
 * Manual test script for detection optimizations
 * Run with: node test-optimizations.js
 */

console.log('🧪 Testing Detection Optimization Patterns\n')

// Simulate callsign detection
function testCallsignDetection() {
  console.log('📞 CALLSIGN DETECTION TESTS')
  console.log('─'.repeat(50))
  
  const tests = [
    { input: "Medical incident reported by S1", expected: "S1" },
    { input: "Alpha 5 on scene", expected: "A5" },
    { input: "Security 12 at gate", expected: "S12" },
    { input: "Event Control requesting update", expected: "Control" },
    { input: "Medical 3 responding", expected: "M3" },
    { input: "Romeo 2 at barrier", expected: "R2" },
    { input: "S-1 on duty", expected: "S1" }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    // Simple pattern matching for testing
    let detected = ''
    
    // Standard format
    const standardMatch = test.input.match(/\b([A-Z])(\d+)\b/)
    if (standardMatch) detected = standardMatch[0]
    
    // NATO phonetic
    const natoMatch = test.input.match(/\b(Alpha|Sierra|Romeo)\s+(\d+)\b/i)
    if (natoMatch) detected = natoMatch[1][0].toUpperCase() + natoMatch[2]
    
    // Security prefix
    const secMatch = test.input.match(/\bSecurity\s+(\d+)\b/i)
    if (secMatch) detected = 'S' + secMatch[1]
    
    // Medical prefix
    const medMatch = test.input.match(/\bMedical\s+(\d+)\b/i)
    if (medMatch) detected = 'M' + medMatch[1]
    
    // Control
    if (/Event Control|Control/i.test(test.input)) detected = 'Control'
    
    // Dash format
    const dashMatch = test.input.match(/\b([A-Z])[\/\-](\d+)\b/)
    if (dashMatch) detected = dashMatch[1] + dashMatch[2]
    
    const pass = detected === test.expected
    if (pass) passed++
    else failed++
    
    console.log(`${pass ? '✅' : '❌'} "${test.input}"`)
    console.log(`   Expected: ${test.expected}, Got: ${detected}\n`)
  })
  
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`Accuracy: ${((passed / tests.length) * 100).toFixed(1)}%\n\n`)
}

// Simulate incident type detection
function testIncidentTypeDetection() {
  console.log('🏷️  INCIDENT TYPE DETECTION TESTS')
  console.log('─'.repeat(50))
  
  const tests = [
    { input: "Fire in building", expected: "Fire" },
    { input: "Medical emergency, person collapsed", expected: "Medical" },
    { input: "Fight at bar area", expected: "Fight" },
    { input: "Current attendance 5000", expected: "Attendance" },
    { input: "Crowd surge at barrier", expected: "Crowd Management" },
    { input: "Theft at merchandise", expected: "Theft" },
    { input: "Person with knife", expected: "Weapon Related" },
    { input: "Evacuation required", expected: "Evacuation" }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    const lower = test.input.toLowerCase()
    let detected = ''
    
    // Simple keyword matching
    if (lower.includes('fire') && !lower.includes('alarm')) detected = 'Fire'
    else if (lower.includes('medical') || lower.includes('collapsed')) detected = 'Medical'
    else if (lower.includes('fight')) detected = 'Fight'
    else if (lower.includes('attendance')) detected = 'Attendance'
    else if (lower.includes('crowd') || lower.includes('surge')) detected = 'Crowd Management'
    else if (lower.includes('theft')) detected = 'Theft'
    else if (lower.includes('weapon') || lower.includes('knife') || lower.includes('gun')) detected = 'Weapon Related'
    else if (lower.includes('evacuation') || lower.includes('evacuate')) detected = 'Evacuation'
    
    const pass = detected === test.expected
    if (pass) passed++
    else failed++
    
    console.log(`${pass ? '✅' : '❌'} "${test.input}"`)
    console.log(`   Expected: ${test.expected}, Got: ${detected}\n`)
  })
  
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`Accuracy: ${((passed / tests.length) * 100).toFixed(1)}%\n\n`)
}

// Simulate priority detection
function testPriorityDetection() {
  console.log('⚡ PRIORITY DETECTION TESTS')
  console.log('─'.repeat(50))
  
  const tests = [
    { input: "Life threatening injury", type: "Medical", expected: "urgent" },
    { input: "Fire outbreak", type: "Fire", expected: "urgent" },
    { input: "Medical emergency", type: "Medical", expected: "high" },
    { input: "Fight in progress", type: "Fight", expected: "high" },
    { input: "Drunk person", type: "Alcohol / Drug Related", expected: "medium" },
    { input: "Theft reported", type: "Theft", expected: "medium" },
    { input: "Lost property", type: "Lost Property", expected: "low" },
    { input: "Attendance count", type: "Attendance", expected: "low" }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    const lower = test.input.toLowerCase()
    let detected = 'medium' // Default
    
    // Urgent keywords
    if (lower.includes('life threatening') || lower.includes('not breathing') || 
        lower.includes('fire') || lower.includes('weapon') || lower.includes('evacuation')) {
      detected = 'urgent'
    }
    // High keywords
    else if (lower.includes('emergency') || lower.includes('fight') || 
             lower.includes('injured') || lower.includes('medical')) {
      detected = 'high'
    }
    // Low keywords
    else if (lower.includes('lost property') || lower.includes('attendance') || 
             lower.includes('timing') || lower.includes('sit rep')) {
      detected = 'low'
    }
    
    const pass = detected === test.expected
    if (pass) passed++
    else failed++
    
    console.log(`${pass ? '✅' : '❌'} "${test.input}" [${test.type}]`)
    console.log(`   Expected: ${test.expected}, Got: ${detected}\n`)
  })
  
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`Accuracy: ${((passed / tests.length) * 100).toFixed(1)}%\n\n`)
}

// Run all tests
console.log('🚀 Starting Optimization Tests...\n\n')
testCallsignDetection()
testIncidentTypeDetection()
testPriorityDetection()

console.log('═'.repeat(50))
console.log('✅ All tests completed!')
console.log('═'.repeat(50))
console.log('\n💡 Note: These are simplified pattern tests.')
console.log('   For full testing, use the actual optimized functions')
console.log('   in the TypeScript files within your Next.js app.\n')

