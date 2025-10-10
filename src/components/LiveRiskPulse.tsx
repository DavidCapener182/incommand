"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { RiskMetricsPayload, RiskStatus } from "@/types/riskPulse";
import { calculateRiskStatus, getStatusConfig, transformHistoryToChartData } from "@/lib/riskPulse";
import type { WebSocketMessage } from "@/lib/websocketService";
import PriorityBadge from "./PriorityBadge";
import { getPriorityBorderClass, normalizePriority, type Priority } from "@/utils/incidentStyles";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface LiveRiskPulseProps {
  className?: string;
}

interface LiveRiskPulseState {
  metrics?: RiskMetricsPayload;
  status: RiskStatus;
  countdownSeconds: number;
  isConnected: boolean;
  lastUpdated?: Date;
  error?: string;
}

const CHANNEL_NAME = "risk-metrics";
const EVENT_TYPE = "risk_metrics_update";
const INITIAL_COUNTDOWN = 30;

const LiveRiskPulse: React.FC<LiveRiskPulseProps> = ({ className }) => {
  const [state, setState] = useState<LiveRiskPulseState>({
    status: "Stable",
    countdownSeconds: INITIAL_COUNTDOWN,
    isConnected: false,
  });

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type !== EVENT_TYPE) return;

    try {
      const payload = message.payload as RiskMetricsPayload;
      const status = calculateRiskStatus(payload);
      setState((prev) => ({
        metrics: payload,
        status,
        countdownSeconds: INITIAL_COUNTDOWN,
        isConnected: true,
        lastUpdated: new Date(message.timestamp || Date.now()),
        error: undefined,
      }));
    } catch (error) {
      console.error("Failed to process risk metrics", error, message);
      setState((prev) => ({
        ...prev,
        error: "Unable to process risk metrics update.",
      }));
    }
  }, []);

  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    channelName: CHANNEL_NAME,
    onMessage: handleMessage,
  });

  useEffect(() => {
    subscribe(handleMessage);
    return () => unsubscribe(handleMessage);
  }, [subscribe, unsubscribe, handleMessage]);

  useEffect(() => {
    setState((prev) => ({ ...prev, isConnected }));
  }, [isConnected]);

  useEffect(() => {
    if (!state.metrics) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        countdownSeconds: Math.max(prev.countdownSeconds - 1, 0),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.metrics]);

  const chartData = useMemo(() => {
    if (!state.metrics) return [];
    return transformHistoryToChartData(state.metrics.history);
  }, [state.metrics]);

  const statusConfig = useMemo(() => getStatusConfig(state.status), [state.status]);

  const highlightClass = useMemo(() => {
    if (!state.metrics) return "border-gray-200";

    const normalizedPriority = normalizePriority((() => {
      const { incident_counts } = state.metrics;
      if (incident_counts.high > 0) return "urgent";
      if (incident_counts.medium > 0) return "high";
      if (incident_counts.low > 0) return "medium";
      return "low";
    })() as Priority);

    return getPriorityBorderClass(normalizedPriority as Priority);
  }, [state.metrics]);

  const countdownLabel = state.metrics
    ? `Next update in ${state.countdownSeconds}s`
    : "Awaiting first update";

  return (
    <section
      className={`relative flex h-full flex-col gap-4 rounded-2xl border p-6 shadow-xl bg-white/95 dark:bg-[#23408e]/95 transition-all ${highlightClass} ${className || ""}`}
      aria-live="polite"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold shadow ${statusConfig.colorClass}`}>
            {statusConfig.label}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">{statusConfig.message}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Live" : "Offline"}
          </span>
          <span>{countdownLabel}</span>
          {state.lastUpdated && (
            <span className="text-gray-400">
              Updated {state.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {state.metrics ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-[#2d437a]/60 dark:bg-[#1b2b57]/60">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incident Counts</h4>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
              {([
                { label: "High", value: state.metrics.incident_counts.high, priority: "urgent" },
                { label: "Medium", value: state.metrics.incident_counts.medium, priority: "high" },
                { label: "Low", value: state.metrics.incident_counts.low, priority: "medium" },
              ] as const).map((item) => (
                <div key={item.label} className="space-y-1">
                  <PriorityBadge priority={item.priority} />
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-[#2d437a]/60 dark:bg-[#1b2b57]/60">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Response Time</h4>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {state.metrics.avg_response_time.toFixed(1)} <span className="text-sm font-medium text-gray-500">min</span>
            </p>
            <p className="text-xs text-gray-500">
              Rolling average (last 60 minutes)
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-[#2d437a]/60 dark:bg-[#1b2b57]/60">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incident Rate</h4>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {state.metrics.incidents_per_hour.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Incidents per hour</p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-[#2d437a]/60 dark:bg-[#1b2b57]/60">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Staff</h4>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {state.metrics.active_staff_count}
            </p>
            <p className="text-xs text-gray-500">Staff reporting active</p>
          </article>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/40 p-6 text-sm text-gray-500 dark:border-[#2d437a]/40 dark:text-gray-300">
          Waiting for live risk metrics…
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm dark:border-[#2d437a]/60 dark:bg-[#1b2b57]/60">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Incident Trend (last hour)
          </h4>
          {state.metrics && (
            <span className="text-xs text-gray-500">
              Peak {Math.max(...chartData.map((point) => point.count), 0).toFixed(1)} incidents/hr
            </span>
          )}
        </div>
        <div className="h-32">
          {state.metrics && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Not enough data for a trend yet
            </div>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>{statusConfig.action}</span>
        {state.error && <span className="text-red-500">{state.error}</span>}
      </footer>
    </section>
  );
};

export default LiveRiskPulse;
