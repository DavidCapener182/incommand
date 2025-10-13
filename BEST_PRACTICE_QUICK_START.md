# Best-Practice Toasts Quick Start Guide

## Enable the Feature

### 1. Set Environment Variables

Add to your `.env.local` or deployment environment:

```bash
# Required: Enable the feature
NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true

# Required: OpenAI API key (for embeddings + LLM)
OPENAI_API_KEY=sk-proj-...

# Optional: Override defaults
OPENAI_BEST_PRACTICE_MODEL=gpt-4o-mini  # Default model
BEST_PRACTICE_TTL_HOURS=36              # Cache TTL in hours (default: 36)
```

### 2. Restart Your Dev Server

```bash
npm run dev
# or
yarn dev
```

### 3. Verify Setup

Check the browser console for any errors when the app loads. You should see:
- No errors related to best-practice features
- Toast context initialized

## Using the Feature

### Create a Test Incident

1. Navigate to your dashboard/incident creation page
2. Create a new incident with:
   - **Type**: Any type EXCEPT "Attendance" or "Sit Rep" (those are ignored)
   - **Occurrence**: Describe a realistic incident, e.g., "Crowd density high at Gate A, potential queue build-up"
   - **Other fields**: Fill as normal

### What to Expect

#### First-Time (Cache Miss)
1. **Spinner Toast** appears immediately:
   ```
   ⏳ Finding best practice…
   Consulting Green Guide
   ```
   Duration: 3 seconds or until response arrives

2. **After 4-7 seconds**, spinner is replaced by:
   ```
   🟦 Best practice: Queue Build-Up
   [Summary text from Green Guide]
   GG §5.2, §5.3
   [Open checklist] [Learn more]
   ```

3. **Click "Open checklist"** to see:
   ```
   Checklist
   • Monitor queue length every 5 minutes
   • Deploy additional staff to manage flow
   • Communicate wait times to patrons
   • Consider opening additional entry points
   [Open guide] [Done]
   ```

#### Subsequent Identical Incidents (Cache Hit)
1. Same spinner toast
2. **After 1.5-3 seconds**, guidance appears (faster due to cache)

### Toast Variants by Risk Level

The toast color and duration automatically adjust:

- **🔴 High Risk** (12 seconds):
  - Red border/accent
  - Types: Medical, Fire, Evacuation, Code Black, etc.
  - Examples: "Fire alarm activated", "Medical emergency"

- **🟠 Medium Risk** (10 seconds):
  - Amber border/accent
  - Types: Aggressive Behavior, Queue Build-Up (severe)
  - Examples: "Crowd surge near stage"

- **🔵 Low Risk** (8 seconds):
  - Blue/gray border/accent
  - Types: Minor incidents, informational
  - Examples: "Lost property reported"

## Testing the Cache

### Test 1: Cache Miss → Hit
```bash
# Create incident #1
Type: "Medical"
Occurrence: "Person collapsed near concession stand"
→ Wait 5-7 seconds for guidance

# Create incident #2 (identical)
Type: "Medical"
Occurrence: "Person collapsed near concession stand"
→ Should receive guidance in ~2 seconds (cache hit!)
```

### Test 2: Different Incidents
```bash
# Create incident #1
Type: "Queue Build-Up"
Occurrence: "Long lines at entrance gate"
→ Receive queue management guidance

# Create incident #2
Type: "Medical"
Occurrence: "Attendee feeling unwell"
→ Receive medical protocol guidance
```

## Monitoring Cache Performance

### Check Cache Entries
```sql
-- View all cached guidance
SELECT 
  incident_type,
  occurrence_excerpt,
  best_practice->>'summary' as summary,
  best_practice->>'risk_level' as risk_level,
  created_at,
  ttl_expires_at
FROM best_practice_cache
ORDER BY created_at DESC
LIMIT 10;
```

### Check Cache Hit Rate
```sql
-- View recent AI usage (includes cache misses)
SELECT 
  endpoint,
  COUNT(*) as total_calls,
  DATE_TRUNC('hour', created_at) as hour
FROM ai_usage_logs
WHERE endpoint LIKE '%best-practice%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, hour
ORDER BY hour DESC;
```

## Rate Limit Testing

### Test User Rate Limit (6/min)
```bash
# Rapidly create 7 different incidents within 1 minute
# The 7th should return rate_limited and show no toast
# Wait 1 minute, then create another → should work
```

### Check Rate Limit Logs
```sql
SELECT 
  user_id,
  COUNT(*) as requests,
  DATE_TRUNC('minute', created_at) as minute
FROM ai_usage_logs
WHERE endpoint LIKE '%best-practice%'
  AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY user_id, minute
ORDER BY requests DESC;
```

## Troubleshooting

### Issue: No Toast Appears

**Check 1: Feature Flag**
```bash
# Verify in .env.local
NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true
```

**Check 2: API Key**
```bash
# Verify OpenAI key is set
echo $OPENAI_API_KEY
# or check .env.local
```

**Check 3: Incident Type**
- ❌ "Attendance" → IGNORED (no toast)
- ❌ "Sit Rep" → IGNORED (no toast)
- ✅ "Medical", "Queue Build-Up", etc. → SHOWS TOAST

**Check 4: Browser Console**
```javascript
// Look for errors like:
// ❌ "Feature flag disabled"
// ❌ "Failed to fetch"
// ❌ "API key not configured"
```

### Issue: Spinner Stays Forever

**Reason**: API call failed or timed out

**Solution**:
1. Check API route: `http://localhost:3000/api/best-practice`
2. Review server logs for errors
3. Verify OpenAI API key is valid
4. Check network tab for 500 errors

### Issue: Wrong Guidance

**Reason**: Green Guide content doesn't match incident type

**Solution**:
1. Check Green Guide ingestion: `SELECT COUNT(*) FROM green_guide_chunks;`
2. Verify chunks exist: `SELECT * FROM green_guide_chunks LIMIT 5;`
3. Test RAG search directly: `POST /api/green-guide-search`
4. Review LLM confidence scores (should be ≥0.5)

### Issue: Slow Performance

**Check Cache**:
```sql
-- Should have entries
SELECT COUNT(*) FROM best_practice_cache;

-- Should have recent hits
SELECT * FROM best_practice_cache 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Check Indexes**:
```sql
-- Should show indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'best_practice_cache';
```

## Advanced Configuration

### Adjust Cache TTL
```bash
# Shorter cache (testing)
BEST_PRACTICE_TTL_HOURS=1

# Longer cache (production)
BEST_PRACTICE_TTL_HOURS=72
```

### Use Different Model
```bash
# Faster/cheaper
OPENAI_BEST_PRACTICE_MODEL=gpt-3.5-turbo

# More accurate (higher cost)
OPENAI_BEST_PRACTICE_MODEL=gpt-4-turbo-preview
```

### Disable Feature Temporarily
```bash
# Turn off without code changes
NEXT_PUBLIC_BEST_PRACTICE_ENABLED=false
```

## API Testing with cURL

### Direct API Call
```bash
curl -X POST http://localhost:3000/api/best-practice \
  -H "Content-Type: application/json" \
  -d '{
    "incidentType": "Medical",
    "occurrence": "Person collapsed at food court",
    "eventId": "your-event-id"
  }'
```

### Expected Response (Success)
```json
{
  "bestPractice": {
    "summary": "Immediately call emergency services and clear the area. Assign trained first aider.",
    "checklist": [
      "Call 999/emergency services immediately",
      "Deploy first aider to scene",
      "Clear immediate area of bystanders",
      "Maintain patient privacy with screens",
      "Document incident details",
      "Prepare for ambulance arrival"
    ],
    "citations": ["GG §8.1", "GG §8.2"],
    "risk_level": "high",
    "confidence": 0.95
  },
  "fromCache": false
}
```

### Expected Response (Rate Limited)
```json
{
  "bestPractice": null,
  "reason": "rate_limited"
}
```

## Monitoring Best Practices

### Daily Checks
- Cache hit rate (target: >70%)
- Average response time (target: <3s for hits, <7s for misses)
- Error rate (target: <5%)

### Weekly Reviews
- Top incident types receiving guidance
- Confidence score distribution
- User feedback (if implemented)
- Cost analysis (OpenAI usage)

---

**Ready to use!** 🚀

For issues or questions, check the main documentation: `BEST_PRACTICE_TOASTS_COMPLETE.md`

