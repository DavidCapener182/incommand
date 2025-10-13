# Testing Guide for RAG & Detection Optimizations

This guide provides multiple ways to test the optimizations, from quick pattern tests to full integration testing in your Next.js app.

---

## 🚀 Quick Start

### **Option 1: Run Pattern Tests** (Fastest)

Test the basic detection patterns without starting the full app:

```bash
node test-optimizations.js
```

This will run 20+ pattern tests for callsign, incident type, and priority detection and show you the results immediately.

**Expected output:**
```
🧪 Testing Detection Optimization Patterns

📞 CALLSIGN DETECTION TESTS
──────────────────────────────────────────────────
✅ "Medical incident reported by S1"
   Expected: S1, Got: S1
...
Results: 7 passed, 0 failed
Accuracy: 100.0%
```

---

## 🔬 Testing Methods

### **1. Pattern Tests (Simple JavaScript)**

**File**: `test-optimizations.js`

**What it tests**:
- Callsign detection patterns (7 tests)
- Incident type detection patterns (8 tests)
- Priority detection patterns (8 tests)

**How to run**:
```bash
node test-optimizations.js
```

**Pros**: Fast, no dependencies, immediate feedback  
**Cons**: Simplified logic, doesn't test actual TypeScript code

---

### **2. Manual Testing in the UI** (Most Realistic)

Test the optimizations in the actual InCommand app:

#### **A. Test Callsign Detection**

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to the Incident Creation Modal

3. Type in the "Quick Add" field or "Occurrence" field:
   ```
   Medical incident at main stage, reported by S1
   ```

4. Click the ✨ (AI parse) button

5. **Verify**:
   - Callsign From should auto-fill with "S1"
   - Should see high confidence (if debugger is visible)

**Test cases to try**:
- `"Security 5 on scene"` → Should detect `S5`
- `"Alpha 12 at gate"` → Should detect `A12`
- `"Medical 3 responding"` → Should detect `M3`
- `"Event Control requesting backup"` → Should detect `Control`

#### **B. Test Incident Type Detection**

1. Type in the incident field:
   ```
   Fire in backstage area, flames visible
   ```

2. Click ✨ to parse

3. **Verify**:
   - Incident Type should be "Fire"
   - Priority should be "urgent" or "high"

**Test cases to try**:
- `"Person collapsed, not breathing"` → Should detect `Medical` + `urgent`
- `"Fight broke out at bar"` → Should detect `Fight` + `high`
- `"Crowd surge at barrier 3"` → Should detect `Crowd Management` + `high`
- `"Lost phone at gate A"` → Should detect `Lost Property` + `low`
- `"Current attendance 5000"` → Should detect `Attendance` + `low`

#### **C. Test Priority Detection**

Type different scenarios and verify the priority is correctly assigned:

| Text | Expected Type | Expected Priority |
|------|---------------|-------------------|
| `"Life threatening injury"` | Medical | Urgent |
| `"Person with weapon"` | Weapon Related | Urgent |
| `"Medical assistance needed"` | Medical | High |
| `"Drunk person causing issue"` | Alcohol / Drug Related | Medium |
| `"Artist on stage"` | Artist On Stage | Low |

---

### **3. Test Best Practice Toasts** (RAG Search)

This tests the optimized RAG search:

1. Start dev server: `npm run dev`

2. Create a new incident (not Attendance/Sit Rep):
   ```
   Crowd surge at main stage, density very high
   ```

3. Submit the incident

4. **Verify**:
   - You should see a spinner toast: "Finding best practice…"
   - Then a best practice toast with Green Guide guidance
   - Toast should stay visible for 12-20 seconds
   - Content should be relevant to crowd management

**Check**:
- Open browser console (F12)
- Look for RAG search logs
- Verify confidence scores
- Check which search method was used (semantic/hybrid/keyword)

---

### **4. Browser Console Testing**

Test the functions directly in the browser console:

1. Start dev server: `npm run dev`

2. Open browser console (F12)

3. Open the incident creation modal

4. In the console, type:

```javascript
// Import detection functions (they should be available globally or import manually)

// Test callsign detection
const text1 = "Medical incident reported by S1 at gate"
console.log("Callsign test:", detectCallsign(text1))

// Test incident type
const text2 = "Fire in building, flames visible"
console.log("Type test:", detectIncidentType(text2))

// Test priority
const text3 = "Life threatening medical emergency"
console.log("Priority test:", detectPriority(text3, "Medical"))
```

---

### **5. Check Form Debugger** (Built-in)

The IncidentFormDebugger component provides real-time feedback:

1. Start dev server (development mode)

2. Open Incident Creation Modal

3. Look for the **"🐛 Debug"** button (only visible in dev mode)

4. Click it to toggle the debugger

5. **View**:
   - Current form data
   - Parsed AI data
   - Validation status
   - Event ID
   - Detection results

---

## 📋 Test Scenarios

### **Scenario 1: Full Incident Flow**

**Input:**
```
Medical incident at the main stage, female has fell and hurt her foot, 
multiple people affected, reported by Security 1, immediate response required
```

**Expected Detection:**
- **Callsign**: `S1` (from "Security 1")
- **Type**: `Medical` (from "medical incident", "fell", "hurt")
- **Priority**: `high` or `urgent` (from "immediate response", "multiple people")

**How to verify:**
1. Create incident with this text
2. Check auto-filled fields
3. Open debug panel
4. Verify all values are correct

---

### **Scenario 2: Ambiguous Input**

**Input:**
```
Person acting strangely near gate A, possibly intoxicated
```

**Expected Detection:**
- **Type**: `Suspicious Behaviour` OR `Alcohol / Drug Related`
- **Priority**: `medium`
- **Alternatives**: Should suggest both types

**How to verify:**
1. Type this text
2. Check if alternatives are shown
3. Verify confidence scores are reasonable (not 100%)
4. Test selecting each alternative

---

### **Scenario 3: Critical Incident**

**Input:**
```
Weapon spotted, person with knife at bar 3, Alpha 5 on scene
```

**Expected Detection:**
- **Callsign**: `A5` (from "Alpha 5")
- **Type**: `Weapon Related`
- **Priority**: `urgent`

**How to verify:**
1. Create incident
2. Verify urgent priority is assigned
3. Check if escalation timer starts
4. Verify high confidence in all detections

---

## 🎯 What to Look For

### **Good Signs:**
- ✅ Callsigns are detected correctly (92% accuracy)
- ✅ Incident types match the description
- ✅ Priorities are appropriate for severity
- ✅ Confidence scores are reasonable (0.7-0.95)
- ✅ Alternative suggestions appear for ambiguous cases
- ✅ Best practice toasts show relevant guidance
- ✅ No errors in browser console

### **Red Flags:**
- ❌ Callsigns not detected or wrong
- ❌ Incident type is "Select Type" or completely wrong
- ❌ Priority is always "medium" (not adapting)
- ❌ Confidence scores are always 1.0 or 0.0
- ❌ Best practice toasts don't appear
- ❌ Console shows errors
- ❌ Performance is slower than before

---

## 🐛 Debugging Tips

### **If callsign detection fails:**

1. Check the console for detection logs
2. Verify the input text has a recognizable pattern
3. Test with simpler inputs: `"S1 on scene"`
4. Check if `detectCallsignWithConfidence` returns null

### **If incident type is wrong:**

1. Check if keywords match the patterns in `incidentTypeDetectionOptimized.ts`
2. Try more explicit text: `"Medical emergency"`
3. Check confidence score - if low, it might be ambiguous
4. Look at alternative suggestions

### **If priority seems off:**

1. Check if incident type is correctly detected first
2. Verify the input has priority indicators
3. Check the `detectPriorityOptimized` response for reasoning
4. Test with clearer keywords: `"urgent"`, `"emergency"`, `"immediate"`

### **If best practice toast doesn't appear:**

1. Check `.env.local` has `NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true`
2. Verify `OPENAI_API_KEY` is set
3. Check incident type is not "Attendance" or "Sit Rep"
4. Look for errors in console
5. Check network tab for `/api/best-practice` call

---

## 📊 Performance Testing

### **Measure Detection Speed:**

In browser console:
```javascript
const text = "Medical incident reported by S1"

console.time('callsign')
const callsign = detectCallsign(text)
console.timeEnd('callsign')

console.time('type')
const type = detectIncidentType(text)
console.timeEnd('type')

console.time('priority')
const priority = detectPriority(text, type)
console.timeEnd('priority')
```

**Expected times:**
- Callsign: < 5ms
- Type: < 10ms
- Priority: < 15ms

### **Measure RAG Search Speed:**

In browser console (during best practice toast):
```javascript
// Look for logs like:
// ⏱️ RAG search completed in 2.3s
// 📊 Confidence: 0.87
// 🔍 Method: hybrid
```

**Expected times:**
- Cache hit: 1.5-3.0s
- Cache miss: 4-7s
- Semantic search: 2-4s
- Hybrid search: 2-5s

---

## ✅ Acceptance Criteria

Test passes if:
- ✅ Callsign detection rate > 90%
- ✅ Incident type accuracy > 85%
- ✅ Priority accuracy > 85%
- ✅ Confidence scores are provided
- ✅ Alternative suggestions work
- ✅ Best practice toasts appear
- ✅ Performance is acceptable (< 500ms for detection)
- ✅ No console errors
- ✅ UI is responsive

---

## 🔄 Regression Testing

After making changes, re-test:

1. Run pattern tests: `node test-optimizations.js`
2. Test 5 different incident scenarios in UI
3. Verify best practice toasts still work
4. Check performance hasn't degraded
5. Review console for new errors

---

## 📝 Report Issues

If you find issues, note:
- Input text that failed
- Expected vs actual result
- Confidence score (if available)
- Console errors
- Screenshots of the debug panel

---

## 🎓 Advanced Testing

### **Load Testing**

Test with many incidents:
```bash
# Create 100 test incidents
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/v1/incidents \
    -H "Content-Type: application/json" \
    -d '{"occurrence": "Medical incident '$i'", "incident_type": "Medical"}'
done
```

### **A/B Testing**

Compare old vs new detection:
1. Create branch with old code
2. Test same incidents in both
3. Compare accuracy rates
4. Measure performance differences

---

## 📞 Need Help?

- Review [RAG_AND_DETECTION_OPTIMIZATION.md](./RAG_AND_DETECTION_OPTIMIZATION.md) for technical details
- Check [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) for overview
- Look at test file examples in `src/utils/__tests__/detectionOptimized.test.ts`

---

**Happy Testing! 🧪**

