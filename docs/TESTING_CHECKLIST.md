# 🧪 Auditable Logging - Testing Checklist

**Server**: http://localhost:3000  
**Status**: ✅ READY

---

## ✅ **Quick Test Checklist**

### **1. Structured Template** (5 min)
- [ ] Open dashboard
- [ ] Click "+ New Incident" (blue button)
- [ ] See structured template with 5 fields
- [ ] Fill out: Headline, Source, Facts, Actions, Outcome
- [ ] Check live word count on headline (X/15)
- [ ] See preview at bottom
- [ ] Submit incident
- [ ] Verify appears in incident table

**Expected Result**: Incident created with professional structure

---

### **2. Real-Time Updates** (5 min)
- [ ] Open 2 browser tabs/windows
- [ ] Create incident in Tab 1
- [ ] See it appear instantly in Tab 2
- [ ] Amend incident in Tab 1
- [ ] See "📝 Log Amended" toast in Tab 2
- [ ] See "AMENDED" badge on incident

**Expected Result**: Live updates across all tabs

---

### **3. Training Mode** (10 min)
- [ ] Click green "Training" button
- [ ] Try Beginner scenario
- [ ] Fill out template in training mode
- [ ] Submit practice incident
- [ ] Verify labeled "TRAINING"
- [ ] Close training mode
- [ ] Verify practice incident NOT in real table

**Expected Result**: Safe practice environment

---

### **4. Help & Standards** (3 min)
- [ ] Go to Help page (bottom nav)
- [ ] Scroll to "Professional Logging Standards"
- [ ] Review template examples
- [ ] Check language guidelines (Use/Avoid)
- [ ] Review JESIP compliance

**Expected Result**: Clear professional standards

---

### **5. Amendment System** (5 min)
- [ ] Open any incident details
- [ ] Click "Amend Entry"
- [ ] Select field to change
- [ ] Enter new value + reason
- [ ] Submit amendment
- [ ] Click "View History"
- [ ] See complete audit trail

**Expected Result**: Full revision tracking

---

### **6. AI Validation** (3 min)
- [ ] Create new incident
- [ ] In "Facts Observed" field, type emotional language
- [ ] Example: "It was chaotic and terrible"
- [ ] See validation warnings appear
- [ ] Example: "Avoid emotional language..."
- [ ] Correct to factual language
- [ ] Warnings disappear

**Expected Result**: Real-time language validation

---

### **7. Log Review Reminder** (Silver Commanders)
- [ ] Wait 30 min (or adjust code for testing)
- [ ] See reminder notification
- [ ] Check activity summary
- [ ] Try "Snooze 15 min"
- [ ] Try "Mark as Reviewed"

**Expected Result**: Periodic review reminders

---

## 🎯 **Quick Test Scenarios**

### **Scenario 1: Basic Logging**
1. Create incident: "Medical - person collapsed at gate"
2. Use structured template
3. Submit and verify

### **Scenario 2: Multi-User**
1. Open 2 tabs
2. Create in Tab 1
3. Watch Tab 2 update
4. Amend in Tab 1
5. See notification in Tab 2

### **Scenario 3: Training**
1. Click Training button
2. Complete Beginner scenario
3. Verify isolated from real data

### **Scenario 4: Amendment**
1. Create incident
2. Amend occurrence field
3. View audit trail
4. Verify AMENDED badge

---

## 🚨 **What to Report**

### **Issues to Watch For:**
- ❌ Incidents not appearing in real-time
- ❌ Training incidents mixing with real data
- ❌ Amendment not showing in audit trail
- ❌ AI validation not triggering
- ❌ Word count not updating
- ❌ Preview not showing correctly

### **Success Indicators:**
- ✅ All fields have tooltips
- ✅ Live updates work across tabs
- ✅ Training mode isolated
- ✅ AMENDED badge appears after amendment
- ✅ Revision history complete
- ✅ Help page shows standards

---

## 📝 **Test Notes Template**

```
Test: [Name of test]
Date: [Date]
Tester: [Your name]

Steps:
1. 
2. 
3. 

Expected Result:


Actual Result:


Issues Found:
- 

Screenshots/Evidence:
- 
```

---

## 🔧 **Troubleshooting**

### **Issue: Server not responding**
```bash
# Kill old processes
pkill -f "next dev" && pkill -f "npm run dev"

# Restart
npm run dev
```

### **Issue: Changes not appearing**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear cache and reload

### **Issue: Database errors**
- Check migration: `database/auditable_logging_phase1_migration.sql`
- Verify backfill script ran

---

**Happy Testing! 🎉**

*Report any issues or feedback for continuous improvement*

