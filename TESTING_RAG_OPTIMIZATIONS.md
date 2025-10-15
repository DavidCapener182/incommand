# Testing RAG and Detection Optimizations

This guide shows you how to test the newly integrated RAG and detection optimizations.

---

## 🧪 Quick Start - 3 Ways to Test

### 1. **Unit Tests (Recommended)** ⚡

Run the comprehensive detection test suite:

```bash
# Install dependencies if needed
npm install

# Run detection tests
npx jest src/utils/__tests__/detection.test.ts

# Run with verbose output
npx jest src/utils/__tests__/detection.test.ts --verbose

# Run specific test suite
npx jest -t "Callsign Detection"
npx jest -t "Incident Type Detection"
npx jest -t "Priority Detection"
```

**What this tests:**
- ✅ 35+ callsign detection patterns
- ✅ 40+ incident type detection patterns  
- ✅ 30+ priority detection scenarios
- ✅ Confidence scoring accuracy
- ✅ Alternative suggestions
- ✅ Edge cases and backward compatibility

---

### 2. **API Testing** 🌐

Test the improvements through your actual API endpoints:

#### **Test RAG Search (Best Practice API)**

```bash
# Create test file
cat > test-best-practice.json << 'EOF'
{
  "incidentType": "Medical",
  "occurrence": "Guest collapsed near main stage, unconscious, not breathing. Crowd surge reported in pit area."
}
EOF

# Test the API
curl -X POST http://localhost:3000/api/best-practice \
  -H "Content-Type: application/json" \
  -d @test-best-practice.json | jq .
```

**Expected improvements:**
- Better context matching (medical + crowd = relevant passages)
- Higher relevance scores
- More specific guidance from Green Guide

#### **Test Priority Detection**

```bash
cat > test-priority.json << 'EOF'
{
  "text": "Urgent - multiple guests collapsed, not breathing, medical team requested immediately"
}
EOF

curl -X POST http://localhost:3000/api/enhanced-incident-parsing \
  -H "Content-Type: application/json" \
  -d @test-priority.json | jq .
```

**Expected result:** Priority should be "urgent" with high confidence

---

### 3. **Interactive Browser Testing** 🖥️

Start your dev server and test through the UI:

```bash
npm run dev
# Open http://localhost:3000
```

#### **Test Incident Creation with Better Detection:**

1. **Navigate to:** Incident creation modal/page
2. **Type in occurrence field:**
   ```
   Security 1 reports hostile act at Gate A. Multiple people involved, 
   one person has a weapon. Immediate response required.
   ```

3. **Check auto-detected fields:**
   - ✅ **Callsign:** Should detect "S1" (Security 1)
   - ✅ **Type:** Should suggest "Hostile Act" or "Weapon Related"
   - ✅ **Priority:** Should detect "urgent" or "high"
   - ✅ **Confidence:** Look for confidence indicators in UI

#### **Test Best Practice Search:**

1. **Create an incident** with type "Medical"
2. **Add occurrence:** "Guest fainted in crowd, conscious but disoriented"
3. **Look for best practice toast/panel**
4. **Verify:**
   - More relevant guidance
   - Better snippet extraction
   - Relevance percentages shown

---

## 📊 Comparison Tests - Before vs After

### Create a Simple Test Script

```bash
# Create test script
cat > test-optimizations.js << 'EOF'
// Test the improvements
const testCases = [
  {
    name: "Complex Medical Incident",
    text: "Guest collapsed at main stage, Sierra 1 responding, CPR in progress, multiple casualties",
    expectedCallsign: "S1",
    expectedType: "Medical",
    expectedPriority: "urgent"
  },
  {
    name: "Crowd Management",
    text: "Crowd surge reported at Gate B by Security 5, immediate crowd control needed",
    expectedCallsign: "S5", 
    expectedType: "Crowd Management",
    expectedPriority: "high"
  },
  {
    name: "Lost Property",
    text: "Guest reports lost phone near merchandise stand",
    expectedCallsign: "",
    expectedType: "Lost Property",
    expectedPriority: "low"
  }
];

console.log("Run these through your detection functions and verify results match expectations");
testCases.forEach((tc, i) => {
  console.log(`\n${i+1}. ${tc.name}`);
  console.log(`   Input: "${tc.text}"`);
  console.log(`   Expected - Callsign: ${tc.expectedCallsign || 'none'}, Type: ${tc.expectedType}, Priority: ${tc.expectedPriority}`);
});
EOF

node test-optimizations.js
```

---

## 🔍 Detailed Feature Testing

### Test Hybrid Search (RAG)

```typescript
// In browser console or Node script
import { searchGreenGuideOptimized } from '@/lib/rag/greenGuide'

// Test semantic + keyword hybrid
const result = await searchGreenGuideOptimized("crowd density management", 5, true)

console.log('Method used:', result.method) // Should show 'hybrid' or 'semantic'
console.log('Confidence:', result.confidence) // Should be 0.7-0.95
console.log('Passages:', result.passages.length)
console.log('Top relevance:', result.passages[0].relevance_score)
```

### Test Confidence Scoring

```typescript
import { detectCallsignWithConfidence } from '@/utils/callsignDetection'

const match = detectCallsignWithConfidence("reported by Security 1 at main gate")

console.log('Callsign:', match.callsign)    // S1
console.log('Confidence:', match.confidence) // Should be > 0.9 (high confidence)
console.log('Context:', match.context)       // Shows surrounding text
```

### Test Alternative Suggestions

```typescript
import { 
  detectIncidentType, 
  getAlternativeIncidentTypes 
} from '@/utils/incidentTypeDetection'

const text = "Guest feeling unwell, dizzy and nauseous"
const primary = detectIncidentType(text)
const alternatives = getAlternativeIncidentTypes(text)

console.log('Primary type:', primary)           // Probably "Medical"
console.log('Alternatives:', alternatives)      // Should include "Welfare"
```

---

## 📈 Performance Testing

### RAG Search Performance

```bash
# Create performance test
cat > test-rag-performance.sh << 'EOF'
#!/bin/bash
echo "Testing RAG search performance..."

# Test 1: Simple query
start=$(date +%s%N)
curl -s -X POST http://localhost:3000/api/best-practice \
  -H "Content-Type: application/json" \
  -d '{"incidentType":"Medical","occurrence":"Guest injured"}' > /dev/null
end=$(date +%s%N)
echo "Simple query: $((($end - $start) / 1000000))ms"

# Test 2: Complex query  
start=$(date +%s%N)
curl -s -X POST http://localhost:3000/api/best-practice \
  -H "Content-Type: application/json" \
  -d '{"incidentType":"Crowd Management","occurrence":"Large crowd surge with multiple casualties during ingress at Gate A"}' > /dev/null
end=$(date +%s%N)
echo "Complex query: $((($end - $start) / 1000000))ms"
EOF

chmod +x test-rag-performance.sh
./test-rag-performance.sh
```

**Expected timings:**
- Semantic search (cache miss): 1.5-3.0s
- Hybrid search: 2.0-4.0s
- Keyword fallback: 0.5-1.0s

---

## ✅ Verification Checklist

After testing, verify these improvements:

### RAG Search (Best Practice API)
- [ ] Better keyword matching (test queries with synonyms)
- [ ] More relevant passages returned
- [ ] Confidence scores shown (if exposed in API)
- [ ] Improved snippet quality
- [ ] Method tracking (semantic/hybrid/keyword)

### Callsign Detection
- [ ] Standard formats work (S1, A2, R5)
- [ ] NATO phonetic works (Alpha 1, Sierra 12)
- [ ] Prefix-based works (Security 1, Medical 2)
- [ ] Control detection works
- [ ] High confidence for contextual matches
- [ ] Lower confidence for standalone mentions

### Incident Type Detection
- [ ] 40+ types detected accurately
- [ ] Phrase matching better than keywords
- [ ] Alternative suggestions provided
- [ ] Confidence scoring available
- [ ] Multi-type incidents handled

### Priority Detection
- [ ] Urgent priority for life-threatening
- [ ] High for security/medical/crowd
- [ ] Medium for welfare/operational
- [ ] Low for informational
- [ ] Confidence based on multiple signals
- [ ] Reasoning provided

---

## 🐛 Debugging Failed Tests

If tests fail, check:

1. **API Key:** Ensure `OPENAI_API_KEY` is set for semantic search
   ```bash
   echo $OPENAI_API_KEY
   # Should show your key
   ```

2. **Database:** Verify `green_guide_chunks` table exists and has data
   ```sql
   SELECT COUNT(*) FROM green_guide_chunks;
   -- Should return > 0
   ```

3. **Dependencies:** Make sure packages are installed
   ```bash
   npm install
   ```

4. **Imports:** Check that test files import from correct paths:
   ```typescript
   // Should import from merged files, not *Optimized files
   from '@/utils/priorityDetection'  // ✅ Correct
   from '@/utils/priorityDetectionOptimized'  // ❌ Old
   ```

---

## 📝 Test Results Documentation

After running tests, document your results:

```bash
# Run all tests and save output
npx jest src/utils/__tests__/detection.test.ts --verbose > test-results.txt 2>&1

# Count passing tests
grep -c "✓" test-results.txt

# Check for any failures
grep "✗" test-results.txt
```

---

## 🎯 Success Criteria

Your tests should show:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **RAG accuracy** | ~89% | Compare results to expected passages |
| **Callsign detection** | ~92% | Run detection test suite |
| **Type detection** | ~89% | Run type detection tests |
| **Priority detection** | ~87% | Run priority detection tests |
| **All unit tests** | Pass | `npx jest` should show all green |
| **No lint errors** | 0 errors | `npm run lint` |
| **API response time** | < 4s | Measure with curl or browser DevTools |

---

## 🚀 Next Steps After Testing

1. **Monitor in production:** Watch for improved incident quality
2. **Collect feedback:** Ask users if auto-detection is better
3. **Fine-tune:** Adjust confidence thresholds if needed
4. **A/B test:** Compare old vs new on subset of users (optional)

---

Need help? Check:
- [RAG_AND_DETECTION_OPTIMIZATION.md](./RAG_AND_DETECTION_OPTIMIZATION.md) - Full implementation details
- Test files in `src/utils/__tests__/` - 100+ test examples
- API routes in `src/app/api/` - Integration examples

