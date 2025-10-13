# Best-Practice Toasts Rollout Checklist

## Phase 1: Development & Testing ✅

### Setup (Completed)
- [x] Database migration applied to `inCommand` project
- [x] All source files created and linted
- [x] Environment variables documented
- [x] Feature flag implemented
- [x] Rate limiting configured
- [x] Cache TTL set (36h default)

### Local Testing (Next Steps)
- [ ] Verify `NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true` in `.env.local`
- [ ] Verify `OPENAI_API_KEY` is set
- [ ] Test incident creation flow
- [ ] Verify spinner toast appears
- [ ] Verify guidance toast appears (or silent failure)
- [ ] Test checklist modal
- [ ] Verify cache hit scenario (create identical incident twice)
- [ ] Test rate limiting (create 7+ incidents rapidly)

### Validation
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Database shows cache entries: `SELECT * FROM best_practice_cache LIMIT 5;`
- [ ] Toast variants display correctly (red/amber/blue based on risk)

## Phase 2: Staging Deployment

### Pre-Deployment
- [ ] Set environment variables in staging:
  ```bash
  NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true
  OPENAI_API_KEY=sk-...
  OPENAI_BEST_PRACTICE_MODEL=gpt-4o-mini
  BEST_PRACTICE_TTL_HOURS=36
  ```
- [ ] Verify Green Guide is ingested in staging DB
- [ ] Verify `green_guide_chunks` table has embeddings
- [ ] Verify `match_green_guide_chunks` RPC exists

### Deploy
- [ ] Push code to staging branch
- [ ] Run database migration (already applied to production):
  ```sql
  -- Verify migration
  SELECT * FROM best_practice_cache LIMIT 1;
  ```
- [ ] Deploy Next.js app
- [ ] Verify build succeeds
- [ ] Check deployment logs for errors

### Staging Testing
- [ ] Create test incidents (Medical, Queue, Fire, etc.)
- [ ] Verify toasts appear within expected time windows
- [ ] Test cache behavior (identical incidents)
- [ ] Test rate limits
- [ ] Monitor response times
- [ ] Check error rates

### Monitoring Setup
- [ ] Set up cache hit rate tracking
- [ ] Set up response time monitoring
- [ ] Set up error rate alerts
- [ ] Set up cost tracking (OpenAI usage)

## Phase 3: Production Rollout

### Pre-Production Checklist
- [ ] Staging tests passing for 24+ hours
- [ ] Cache hit rate >70%
- [ ] Error rate <5%
- [ ] Average response time <3s (cache hit), <7s (miss)
- [ ] No user-reported issues in staging

### Gradual Rollout Strategy

#### Step 1: Admin-Only (Week 1)
- [ ] Deploy to production with flag OFF
  ```bash
  NEXT_PUBLIC_BEST_PRACTICE_ENABLED=false
  ```
- [ ] Create admin-only override (optional):
  ```typescript
  // In featureFlags.ts
  const isAdmin = checkAdminRole(user)
  best_practice_enabled: isAdmin || process.env.NEXT_PUBLIC_BEST_PRACTICE_ENABLED === 'true'
  ```
- [ ] Enable for admin users only
- [ ] Admin team tests for 1 week
- [ ] Collect feedback
- [ ] Monitor performance metrics
- [ ] Fix any issues discovered

#### Step 2: Beta Users (Week 2)
- [ ] Expand to 10-20% of users (feature flag or role-based)
- [ ] Monitor metrics closely:
  - Cache hit rate
  - Response times
  - Error rates
  - User feedback
- [ ] Adjust parameters if needed:
  - TTL hours
  - Number of passages (k)
  - Confidence threshold
  - Rate limits

#### Step 3: Full Rollout (Week 3+)
- [ ] Enable for all users:
  ```bash
  NEXT_PUBLIC_BEST_PRACTICE_ENABLED=true
  ```
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Verify no performance degradation
- [ ] Check cost vs. budget

### Production Monitoring

#### Daily Checks (First Week)
- [ ] Cache hit rate (target: >70%)
  ```sql
  SELECT 
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_entries,
    COUNT(*) as total_entries
  FROM best_practice_cache;
  ```
- [ ] Error rate (target: <5%)
  ```sql
  SELECT COUNT(*) FROM ai_usage_logs 
  WHERE endpoint LIKE '%best-practice%' 
    AND created_at > NOW() - INTERVAL '24 hours';
  ```
- [ ] Response time distribution
- [ ] OpenAI API costs

#### Weekly Reviews
- [ ] Top incident types receiving guidance
- [ ] Confidence score distribution
  ```sql
  SELECT 
    best_practice->>'risk_level' as risk,
    AVG((best_practice->>'confidence')::float) as avg_confidence,
    COUNT(*) as count
  FROM best_practice_cache
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY risk;
  ```
- [ ] User engagement (checklist opens, learn more clicks)
- [ ] Cost analysis
- [ ] Quality spot checks (random guidance review)

### Rollback Plan

If issues arise:

1. **Immediate Disable**:
   ```bash
   # Set in production env
   NEXT_PUBLIC_BEST_PRACTICE_ENABLED=false
   ```
   - No code deployment needed
   - Takes effect on next page load
   - Feature gracefully disappears

2. **Investigate Issues**:
   - Check error logs
   - Review failed requests
   - Analyze performance metrics
   - Gather user feedback

3. **Fix & Re-enable**:
   - Fix identified issues
   - Test in staging
   - Re-enable in production

## Phase 4: Optimization & Enhancement

### Performance Tuning
- [ ] Analyze cache efficiency
- [ ] Adjust TTL based on hit patterns
- [ ] Fine-tune passage count (k=5 optimal?)
- [ ] Optimize LLM prompt for better responses
- [ ] Consider prompt caching for common patterns

### Feature Enhancements
- [ ] Add "Don't show again" session persistence
- [ ] Implement deep-linking to Green Guide sections
- [ ] Add user feedback collection ("Was this helpful?")
- [ ] Create admin dashboard for guidance analytics
- [ ] Add multilingual support

### Cost Optimization
- [ ] Implement Redis caching for faster hits
- [ ] Batch similar incidents
- [ ] Pre-compute common incident patterns
- [ ] Negotiate OpenAI volume pricing
- [ ] Consider fine-tuned smaller model

## Success Metrics

### Phase 1 (Development) ✅
- [x] All code implemented
- [x] No linter errors
- [x] Migration applied
- [x] Local tests passing

### Phase 2 (Staging)
- [ ] Cache hit rate >70%
- [ ] Response time <3s (hit), <7s (miss)
- [ ] Error rate <5%
- [ ] Zero critical bugs
- [ ] Admin approval

### Phase 3 (Production)
- [ ] 90%+ uptime
- [ ] User satisfaction >4/5
- [ ] Cost within budget ($X/month)
- [ ] Zero P0/P1 incidents
- [ ] Positive user feedback

### Phase 4 (Optimization)
- [ ] Cache hit rate >80%
- [ ] Response time <2s (hit), <5s (miss)
- [ ] Cost reduced by 20%
- [ ] User engagement increased
- [ ] Feature adoption >50% of incidents

## Go/No-Go Checklist

### Before Staging
- [x] Code complete
- [x] Tests written
- [x] Documentation complete
- [ ] Staging environment ready
- [ ] Team aligned on rollout plan

### Before Production Beta
- [ ] Staging stable for 24+ hours
- [ ] All metrics green
- [ ] Admin team approved
- [ ] Rollback plan tested
- [ ] Monitoring in place

### Before Full Production
- [ ] Beta successful (>1 week)
- [ ] User feedback positive
- [ ] Performance validated
- [ ] Cost validated
- [ ] Leadership approval

---

## Current Status: 🟢 Ready for Local Testing

**Next Action**: Enable feature flag locally and begin testing

**Blockers**: None

**Estimated Timeline**:
- Local testing: 1-2 days
- Staging: 3-5 days  
- Production beta: 1 week
- Full rollout: 2-3 weeks total

**Owner**: Development Team

**Stakeholders**: Product, Engineering, Operations, Finance (cost tracking)

