# Analytics Quick Guide - Where to Find Everything

## 🎯 Quick Access

### **Analytics Page Location:**
1. Navigate to: **`http://localhost:3000/analytics`**
2. Or click: **"Analytics"** in your main navigation menu

---

## 📊 **Tab Overview**

Once on the Analytics page, you'll see **4 prominent tabs** at the top:

### **Tab 1: 📊 Operational Metrics** (Default)
- This is the **original analytics view** you're already familiar with
- Shows: Total incidents, response times, incident types, priority breakdown
- Contains: Charts for incident volume, attendance tracking, and operational metrics
- **Default active tab** when you first load the page

### **Tab 2: ✨ Log Quality** (NEW!)
- Click this tab to see the **Log Quality Dashboard**
- Shows:
  - Overall quality score (0-100 with circular progress indicator)
  - Completeness, Timeliness, and Factual Language scores
  - Quality trend over time (line chart)
  - Entry type distribution (pie chart)
  - Field-by-field completeness breakdown
  - Top performing operators leaderboard 🥇🥈🥉

### **Tab 3: ✅ JESIP/JDM Compliance** (NEW!)
- Click this tab to see the **Compliance Dashboard**
- Shows:
  - Compliance grade (A-F)
  - Overall compliance percentage
  - Audit trail completeness
  - Immutability score
  - Timestamp accuracy
  - Justification rate
  - Legal readiness checklist
  - **Export Report button** (downloads JSON compliance report)
  - Actionable recommendations

### **Tab 4: 👥 Staff Performance** (NEW!)
- Click this tab to see the **User Activity Dashboard**
- Shows:
  - Active operators count
  - Average entries per operator
  - Average handling time
  - Top quality score
  - Incidents per operator (bar chart)
  - Quality scores by operator (bar chart)
  - Detailed performance table with:
    - Total entries
    - Quality score with progress bar
    - Entries per hour
    - Retrospective percentage
    - Amendment percentage
  - Medal system for top 3 performers 🥇🥈🥉

---

## 🔍 **Visual Appearance**

The tabs now have **enhanced visibility**:
- **Active tab**: Blue background with blue border
- **Inactive tabs**: Gray background, hover to see highlight
- **Icons**: Each tab has a distinctive icon
- **Full-width**: Tabs span the width of the page
- **Card style**: Tabs are contained in a white card with shadow

---

## 📅 **Date Range**

- Default: Last 7 days
- All new dashboards (Quality, Compliance, Staff) use this date range
- Future enhancement: Date picker will be added

---

## 🚀 **How to Test**

1. **Start your server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to Analytics**:
   ```
   http://localhost:3000/analytics
   ```

3. **Click each tab** to explore:
   - Click **"Log Quality"** → See quality metrics
   - Click **"JESIP/JDM Compliance"** → See compliance dashboard
   - Click **"Staff Performance"** → See operator metrics
   - Click **"Operational Metrics"** → Back to original view

---

## 🎨 **What You Should See**

### On "Log Quality" Tab:
- Large circular score at the top
- 3 metric cards (Completeness, Timeliness, Factual Language)
- Quality trend line chart
- Score breakdown bar chart
- Pie chart showing entry types
- Field completion progress bars
- Leaderboard table with operators

### On "Compliance" Tab:
- Large letter grade (A-F)
- 4 compliance metric cards
- Compliance trend line chart
- Horizontal bar chart breakdown
- Checkmarks for legal readiness
- Blue recommendations panel
- Export button (top right)

### On "Staff Performance" Tab:
- 4 summary cards at top
- Colorful bar chart of incidents per operator
- Green bar chart of quality scores
- Detailed table with all operator metrics
- Color-coded quality indicators

---

## ❓ **Troubleshooting**

### "I don't see the tabs"
- Refresh the page (`Cmd+R` or `Ctrl+R`)
- Check that you're on `/analytics` page
- Look for a white card with 4 buttons below the page title

### "The page is loading"
- Wait for the spinner to finish (queries can take a few seconds)
- If it takes longer than 10 seconds, check browser console for errors

### "No data available"
- Make sure you have incident logs in your database
- Check the date range (default is last 7 days)
- Try the Operational tab first to verify basic analytics work

### "Charts not showing"
- Open browser console (F12) and check for JavaScript errors
- Ensure all dependencies are installed (`npm install`)
- Clear browser cache

---

## 📋 **Next Steps**

After exploring the dashboards:
1. Create some test incident logs with structured template
2. Mark some as retrospective or amended
3. Return to analytics to see the metrics update
4. Export a compliance report
5. Compare operator performance

---

## 💡 **Tips**

- **Hover over charts** to see detailed tooltips
- **Scroll down** on each tab - there's lots of content!
- **Export compliance reports** for official documentation
- **Check the leaderboards** to recognize top performers
- **Review recommendations** on Compliance tab for improvements

---

**Need Help?** Check the browser console (F12) for any error messages.

