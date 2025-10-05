# Live Risk Pulse – Architectural Notes

This document captures the initial design decisions for the inCommand v2.0 Live Risk Pulse feature. It will evolve as implementation proceeds.

## 1. Data Contract

### 1.1 WebSocket Channel
- **Endpoint:** `/ws/v1/live`
- **Channel name:** `risk-metrics` (matches server broadcast namespace)
- **Event type:** `risk_metrics_update`
- **Delivery cadence:** every 5 seconds (server push)

### 1.2 Message Shape
```ts
interface RiskMetricsMessage {
  type: 'risk_metrics_update';
  payload: RiskMetricsPayload;
  timestamp: number; // server epoch (ms)
}

interface RiskMetricsPayload {
  incident_counts: {
    high: number;
    medium: number;
    low: number;
  };
  avg_response_time: number;         // minutes (rolling 60 min window)
  incidents_per_hour: number;        // rolling 60 min window
  active_staff_count: number;
  timestamp: string;                 // ISO8601 of the snapshot
  history: RiskHistoryPoint[];       // last 60 minutes, 5-minute buckets
}

interface RiskHistoryPoint {
  time: string;                      // ISO8601 bucket start
  count: number;                     // incidents per hour equivalent
}
```

### 1.3 Derived Status Logic
- **Escalate** if `incident_counts.high > 0` OR `incident_counts.medium > 3` OR `avg_response_time > 10` (min)
- **Monitor** if not `Escalate` but `incident_counts.medium > 0`
- **Stable** otherwise

These rules will live in a small pure helper so they can be shared with tests.

## 2. Component & State Shape

### 2.1 Component Skeleton (`src/components/LiveRiskPulse.tsx`)
- Client component (uses websockets, timers)
- Internal state:
  ```ts
  interface LiveRiskPulseState {
    metrics?: RiskMetricsPayload;
    status: RiskStatus;              // 'Escalate' | 'Monitor' | 'Stable'
    countdownSeconds: number;        // 30 → 0, resets on each update
    isConnected: boolean;            // channel subscription health
    lastUpdated?: Date;
    error?: string;                  // connection or parsing issues
  }
  ```
- Hooks:
  - `useWebSocket` (channel `risk-metrics`, auto reconnect)
  - `useEffect` for countdown timer (1 second interval)
  - `useMemo` for derived UI slices (e.g., KPI cards, sparkline data)

### 2.2 UI Blocks
1. **Status Header**
   - Risk status badge (colour-coded) + message + action hint
   - Connection indicator (connected / reconnecting)
   - Countdown chip (e.g., “Next update in 23s”)
2. **Metrics Grid**
   - Incident counts (H/M/L) with priority colours
   - Average response time, incidents/hour, active staff
   - Each metric uses shared priority helpers for consistency
3. **Trend Card**
   - Sparkline via Recharts `<ResponsiveContainer>`
   - Accessible alternative text (e.g., `aria-live="polite"` summary)
4. **Actions / Insights**
   - CTA button referencing `RISK_CONFIG[action]`
   - Optional message from payload (`payload.message` future extension)

### 2.3 Styling & Shared Utilities
- Reuse the existing priority styling utilities (`getPriorityDisplayConfig`, `PriorityBadge`).
- Add a small `getRiskStatusConfig` helper returning colour/icon/message based on `RiskStatus`.
- Extend Tailwind theme if we need additional gradients (likely reuse existing palette).

## 3. Error Handling & Resilience
- `useWebSocket` already includes reconnect logic; LiveRiskPulse will surface its connection state (show “Reconnecting…” toast/badge).
- Graceful degradation: show skeleton/loading message when `metrics` undefined.
- Malformed payload: log via `logger.error`, keep last known metrics.

## 4. Testing Strategy
- **Unit tests** (Jest)
  - `calculateRiskStatus` helper (covers rule matrix)
  - `transformHistoryToChartData` helper (ensures input → chart format)
  - Countdown reducer (fast-forward timers)
- **Component tests** (React Testing Library)
  - Renders skeleton, escalate/monitor/stable variants
  - Handles incoming socket message (mock `useWebSocket` hook)
  - Countdown resets on new message
- **Integration “mock server” test** (optional) verifying WebSocket event wiring with `websocketService.send` mocked.

## 5. Next Implementation Steps
1. Create shared types (`src/types/riskPulse.ts`) and helper functions (`src/lib/riskPulse.ts`).
2. Extend `WebSocketMessage` union (`websocketService.ts`) to include `'risk_metrics_update'`.
3. Build `LiveRiskPulse` component skeleton + UI.
4. Integrate into dashboard layout (P2 analytics section).
5. Add tests + story (if using Storybook later).

---
_Last updated: 2025-02-14_
