# Best-Practice Toasts: Test Plan

## Pre-Test Setup

### 1. Verify Environment Variables
```bash
# Check these are set in your .env.local
cat .env.local | grep BEST_PRACTICE
cat .env.local | grep OPENAI_API_KEY

# Should see:
# NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true
# OPENAI_API_KEY=sk-...
```

### 2. Restart Dev Server
```bash
# Kill existing process
pkill -f "next dev"

# Start fresh
npm run dev
```

### 3. Open Browser DevTools
- Open Chrome/Firefox DevTools
- Go to Console tab
- Go to Network tab
- Clear any existing logs

## Test Suite

### Test 1: Basic Flow (Cache Miss)
**Objective**: Verify end-to-end flow with no cache

**Steps**:
1. Navigate to incident creation page
2. Create a new incident:
   ```
   Type: Medical
   Occurrence: Person collapsed at food court area near Gate A
   Location: Gate A
   Priority: High
   [Fill other required fields]
   ```
3. Submit the incident

**Expected Results**:
- ✅ Spinner toast appears immediately: "Finding best practice… Consulting Green Guide"
- ✅ After 4-7 seconds, spinner is replaced by guidance toast
- ✅ Toast has RED accent (high risk medical incident)
- ✅ Toast shows summary text about medical response
- ✅ Toast shows citations (e.g., "GG §8.1, §8.2")
- ✅ Toast has "Open checklist" and "Learn more" buttons
- ✅ Toast auto-dismisses after 12 seconds (high risk = 12s)
- ✅ Console shows no errors
- ✅ Network tab shows POST to `/api/best-practice` (status 200)

**Verify in Database**:
```sql
SELECT * FROM best_practice_cache 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- incident_hash: [some hash]
-- incident_type: Medical
-- best_practice: {summary, checklist, citations, risk_level: "high", confidence: 0.8+}
```

### Test 2: Cache Hit
**Objective**: Verify cache speeds up subsequent identical requests

**Steps**:
1. Create another incident with SAME details:
   ```
   Type: Medical
   Occurrence: Person collapsed at food court area near Gate A
   Location: Gate A
   Priority: High
   ```
2. Submit the incident

**Expected Results**:
- ✅ Spinner toast appears
- ✅ After 1.5-3 seconds (FASTER), guidance toast appears
- ✅ Same guidance as Test 1
- ✅ Network tab shows POST to `/api/best-practice` (status 200)
- ✅ Response includes `"fromCache": true`

### Test 3: Different Risk Levels
**Objective**: Verify toast variants by risk level

**Test 3a: Medium Risk**
```
Type: Queue Build-Up
Occurrence: Long lines forming at entrance gates, estimated 200+ people
Duration: 10 seconds, AMBER accent
```

**Test 3b: Low Risk**
```
Type: Lost Property
Occurrence: Mobile phone found near seating area
Duration: 8 seconds, BLUE accent
```

### Test 4: Ignored Types
**Objective**: Verify Attendance and Sit Rep are ignored

**Test 4a: Attendance**
```
Type: Attendance
Occurrence: Staff member John Smith signed in
Expected: NO toast appears (feature skips these types)
```

**Test 4b: Sit Rep**
```
Type: Sit Rep  
Occurrence: All areas clear, no incidents
Expected: NO toast appears (feature skips these types)
```

### Test 5: Checklist Modal
**Objective**: Verify modal interaction

**Steps**:
1. Create a Medical incident (from Test 1)
2. Wait for guidance toast
3. Click "Open checklist" button

**Expected Results**:
- ✅ Modal opens with dark overlay
- ✅ Modal shows "Checklist" header
- ✅ Modal shows 3-6 bullet points (imperative verbs)
- ✅ Each bullet is actionable (e.g., "Call emergency services")
- ✅ Modal has "Open guide" and "Done" buttons
- ✅ Clicking "Done" closes modal
- ✅ Clicking overlay closes modal
- ✅ Escape key closes modal

### Test 6: Rate Limiting
**Objective**: Verify rate limits prevent abuse

**Steps**:
1. Rapidly create 7 DIFFERENT incidents within 1 minute:
   ```
   1. Type: Medical, Occurrence: Incident A
   2. Type: Medical, Occurrence: Incident B
   3. Type: Medical, Occurrence: Incident C
   4. Type: Medical, Occurrence: Incident D
   5. Type: Medical, Occurrence: Incident E
   6. Type: Medical, Occurrence: Incident F
   7. Type: Medical, Occurrence: Incident G
   ```

**Expected Results**:
- ✅ First 6 incidents show toasts
- ✅ 7th incident shows NO toast (rate limited)
- ✅ Console shows: "Rate limited" or similar message
- ✅ Network tab shows response: `{"bestPractice": null, "reason": "rate_limited"}`
- ✅ Wait 60 seconds
- ✅ Create 8th incident → toast appears again (rate limit reset)

### Test 7: PII Scrubbing
**Objective**: Verify personal data is removed

**Steps**:
1. Create incident with PII:
   ```
   Type: Medical
   Occurrence: John Doe (john.doe@email.com, 555-1234) collapsed. ID: 123e4567-e89b-12d3-a456-426614174000
   ```
2. Check database cache entry

**Expected Results**:
```sql
SELECT occurrence_excerpt FROM best_practice_cache 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- "John Doe ([email], [phone]) collapsed. ID: [id]"
```

### Test 8: Error Handling
**Objective**: Verify graceful failures

**Test 8a: Invalid API Key**
```bash
# Temporarily set wrong key
OPENAI_API_KEY=sk-invalid
```
- ✅ Spinner appears
- ✅ Spinner dismisses after timeout (no guidance toast)
- ✅ Console shows error (dev mode only)
- ✅ No user-facing error message

**Test 8b: Feature Disabled**
```bash
NEXT_PUBLIC_BEST_PRACTICE_ENABLED=false
```
- ✅ No spinner appears
- ✅ No guidance toast appears
- ✅ Incident creation works normally

**Test 8c: Low Confidence**
```
Type: Custom Made Up Type
Occurrence: Something completely unrelated to Green Guide
```
- ✅ Spinner appears
- ✅ Spinner dismisses (no guidance - confidence too low)
- ✅ Console may show "low_confidence" reason

### Test 9: Performance
**Objective**: Verify response times

**Measure**:
1. Use browser DevTools Performance tab
2. Record during incident creation
3. Check `/api/best-practice` timing

**Expected**:
- ✅ Cache hit: <3000ms total time
- ✅ Cache miss: <7000ms total time
- ✅ No UI blocking/freezing
- ✅ Page remains interactive during fetch

### Test 10: Mobile Responsiveness
**Objective**: Verify mobile UX

**Steps**:
1. Open DevTools mobile emulation (iPhone 12)
2. Create incident
3. Verify toast display

**Expected Results**:
- ✅ Toast fits on mobile screen
- ✅ Text is readable (not too small)
- ✅ Buttons are tappable (>44px touch target)
- ✅ Modal is mobile-friendly
- ✅ Checklist scrolls if needed

## Database Verification Queries

### Check Cache Entries
```sql
-- View recent cache
SELECT 
  incident_type,
  LEFT(occurrence_excerpt, 50) as excerpt,
  best_practice->>'summary' as summary,
  best_practice->>'risk_level' as risk,
  (best_practice->>'confidence')::float as confidence,
  created_at,
  ttl_expires_at
FROM best_practice_cache
ORDER BY created_at DESC
LIMIT 10;
```

### Check AI Usage
```sql
-- View recent API calls
SELECT 
  endpoint,
  model,
  tokens_used,
  cost_usd,
  user_id,
  created_at
FROM ai_usage_logs
WHERE endpoint LIKE '%best-practice%'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Cache Hit Rate
```sql
-- Calculate hit rate (last hour)
WITH stats AS (
  SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT incident_hash) as unique_incidents
  FROM best_practice_cache
  WHERE created_at > NOW() - INTERVAL '1 hour'
)
SELECT 
  total_requests,
  unique_incidents,
  ROUND((1 - (unique_incidents::float / NULLIF(total_requests, 0))) * 100, 2) as hit_rate_percent
FROM stats;
```

## API Testing (cURL)

### Direct API Call
```bash
curl -X POST http://localhost:3000/api/best-practice \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "incidentType": "Medical",
    "occurrence": "Person collapsed at venue",
    "eventId": "test-event-id"
  }' | jq
```

**Expected Response**:
```json
{
  "bestPractice": {
    "summary": "Immediately call emergency services...",
    "checklist": [
      "Call 999/emergency services",
      "Deploy first aider",
      "Clear area",
      "Maintain privacy",
      "Document incident"
    ],
    "citations": ["GG §8.1", "GG §8.2"],
    "risk_level": "high",
    "confidence": 0.95
  },
  "fromCache": false
}
```

## Troubleshooting Tests

### If No Toast Appears
1. Check console for errors
2. Verify feature flag: `localStorage.getItem('bestPracticeEnabled')`
3. Check incident type (not Attendance/Sit Rep?)
4. Verify API key is set
5. Check network tab for failed requests

### If Wrong Guidance
1. Check Green Guide is ingested: `SELECT COUNT(*) FROM green_guide_chunks;`
2. Test RAG search: `POST /api/green-guide-search`
3. Check confidence score (may be too low)
4. Verify incident description is clear

### If Slow Performance
1. Check cache entries: `SELECT COUNT(*) FROM best_practice_cache;`
2. Verify indexes exist
3. Check OpenAI API status
4. Review network latency

## Sign-Off Checklist

- [ ] All 10 tests passing
- [ ] Database queries return expected data
- [ ] API curl test successful
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance within targets
- [ ] Error handling works
- [ ] Cache behavior correct
- [ ] Rate limiting functional
- [ ] Documentation reviewed

## Final Validation

```bash
# Run this to verify setup
echo "=== Best-Practice Toasts Health Check ==="
echo ""
echo "1. Feature Flag:"
grep BEST_PRACTICE .env.local
echo ""
echo "2. OpenAI Key:"
grep OPENAI_API_KEY .env.local | cut -c1-30
echo ""
echo "3. Database Table:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM best_practice_cache;"
echo ""
echo "4. Green Guide Chunks:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM green_guide_chunks;"
echo ""
echo "✅ If all checks pass, you're ready to test!"
```

---

**Test Status**: ⏳ Pending

**Estimated Testing Time**: 30-45 minutes

**Tester**: [Your Name]

**Date**: [Date]

**Environment**: Development / Staging / Production

**Pass/Fail**: [ ] Pass [ ] Fail

**Notes**:

