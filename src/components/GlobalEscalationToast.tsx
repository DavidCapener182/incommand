'use client'

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import EscalationTimer from './EscalationTimer';

interface EscalationToastIncident {
  id: number;
  occurrence: string;
  incident_type: string;
  priority: string;
  escalate_at: string | null;
  status: string;
  is_closed: boolean;
  escalation_level?: number | null;
}

export default function GlobalEscalationToast() {
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [incident, setIncident] = useState<EscalationToastIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();
    setCurrentEventId(data?.id ?? null);
  };

  const fetchNextEscalatingIncident = async (eventId?: string | null) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const runFetch = async (scopeEventId?: string | null) => {
        // 1) Overdue first (escalate_at <= now)
        let overdueQuery = supabase
          .from('incident_logs')
          .select('id, occurrence, incident_type, priority, escalate_at, status, is_closed, escalation_level')
          .eq('is_closed', false)
          .in('status', ['open', 'in-progress'])
          .not('escalate_at', 'is', null)
          .lte('escalate_at', now)
          .order('escalate_at', { ascending: true });
        if (scopeEventId) overdueQuery = overdueQuery.eq('event_id', scopeEventId);
        const { data: overdue, error: overdueErr } = await overdueQuery.limit(1);
        if (overdueErr) throw overdueErr;
        if (overdue && overdue.length > 0) {
          const candidate = overdue[0] as EscalationToastIncident;
          if (!hiddenIds.has(candidate.id)) {
            setIncident(candidate);
            return true;
          }
        }
        // 2) Upcoming next (escalate_at > now)
        let upcomingQuery = supabase
          .from('incident_logs')
          .select('id, occurrence, incident_type, priority, escalate_at, status, is_closed, escalation_level')
          .eq('is_closed', false)
          .in('status', ['open', 'in-progress'])
          .not('escalate_at', 'is', null)
          .gt('escalate_at', now)
          .order('escalate_at', { ascending: true });
        if (scopeEventId) upcomingQuery = upcomingQuery.eq('event_id', scopeEventId);
        const { data: upcoming, error: upcomingErr } = await upcomingQuery.limit(1);
        if (upcomingErr) throw upcomingErr;
        if (upcoming && upcoming.length > 0) {
          const candidate = upcoming[0] as EscalationToastIncident;
          if (!hiddenIds.has(candidate.id)) {
            setIncident(candidate);
            return true;
          }
        }
        return false;
      };

      // Try scoped to event
      let found = await runFetch(eventId);
      // Fallback global if not found
      if (!found) {
        found = await runFetch(undefined);
      }
      if (!found) setIncident(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentEvent();
  }, []);

  useEffect(() => {
    // Initial fetch (try with event, fall back to global)
    if (currentEventId) {
      fetchNextEscalatingIncident(currentEventId);
    } else {
      fetchNextEscalatingIncident();
    }
    // Poll every 15s
    if (pollingRef.current) clearInterval(pollingRef.current as any);
    pollingRef.current = setInterval(() => fetchNextEscalatingIncident(currentEventId), 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current as any);
    };
  }, [currentEventId]);

  // Auto-collapse after ~10s when a new incident is shown
  useEffect(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current as any);
    setCollapsed(false);
    if (incident) {
      collapseTimerRef.current = setTimeout(() => setCollapsed(true), 10000);
    }
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current as any);
    };
  }, [incident?.id]);

  const onMoveToInProgress = async () => {
    if (!incident) return;
    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({ status: 'in-progress' })
        .eq('id', incident.id);
      if (error) throw error;
      // Refresh selection
      if (currentEventId) fetchNextEscalatingIncident(currentEventId);
    } catch (e) {
      console.error('Failed to move to in-progress:', e);
    }
  };

  const onAddInfo = async () => {
    if (!incident) return;
    const note = window.prompt('Add info to this incident:');
    if (!note || !note.trim()) return;
    try {
      // Append note to both occurrence and action_taken so it shows clearly on the log
      const { data, error } = await supabase
        .from('incident_logs')
        .select('occurrence, action_taken')
        .eq('id', incident.id)
        .single();
      if (error) throw error;
      const prevOccurrence = (data?.occurrence as string) || '';
      const prevActions = (data?.action_taken as string) || '';

      const normalizedNote = note.trim().replace(/\s+/g, ' ');
      const updatedOccurrence = `${prevOccurrence ? prevOccurrence.replace(/\.$/, '') + '. ' : ''}Update: ${normalizedNote}.`;
      const appendedAction = `Update: ${normalizedNote}.`;
      const updatedActions = prevActions ? `${prevActions.trim()} ${appendedAction}` : appendedAction;

      const { error: updErr } = await supabase
        .from('incident_logs')
        .update({ occurrence: updatedOccurrence, action_taken: updatedActions })
        .eq('id', incident.id);
      if (updErr) throw updErr;
      // Local reflect
      setIncident({ ...incident, occurrence: updatedOccurrence });
    } catch (e) {
      console.error('Failed to add info:', e);
    }
  };

  const onCloseLog = async () => {
    if (!incident) return;
    try {
      const { error } = await supabase
        .from('incident_logs')
        .update({ is_closed: true, status: 'closed' })
        .eq('id', incident.id);
      if (error) throw error;
      // Refresh selection
      if (currentEventId) fetchNextEscalatingIncident(currentEventId);
    } catch (e) {
      console.error('Failed to close log:', e);
    }
  };

  const onHide = () => {
    if (!incident) return;
    setHiddenIds(prev => new Set(prev).add(incident.id));
    setIncident(null);
  };

  if (!incident || !incident.escalate_at) return null;

  // Compact countdown formatter
  const formatTime = (iso: string) => {
    const diff = Math.max(0, new Date(iso).getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed top-4 right-4 z-[2000] w-[360px]">
      <div className="rounded-lg shadow-lg border bg-white dark:bg-[#0f1b3d] border-red-200 dark:border-red-500/50 ring-2 ring-red-400 animate-pulse-glow">
        {collapsed ? (
          <div className="p-2 flex items-center gap-2">
            <button onClick={() => setCollapsed(false)} className="text-gray-600 hover:text-gray-800 text-xs" title="Expand">▼</button>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-red-800 dark:text-red-300 truncate">Escalation: {incident.incident_type}</div>
              <div className="text-[11px] text-gray-700 dark:text-gray-300 truncate">Priority {incident.priority} • {incident.escalate_at ? formatTime(incident.escalate_at) : '00:00'}</div>
            </div>
            <button onClick={onMoveToInProgress} className="px-2 py-1 rounded bg-yellow-500 text-white text-[10px] hover:bg-yellow-600">In-Progress</button>
            <button onClick={onCloseLog} className="px-2 py-1 rounded bg-red-600 text-white text-[10px] hover:bg-red-700">Close</button>
            <button onClick={onHide} className="ml-1 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Escalation Timer</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCollapsed(true)} className="text-gray-600 hover:text-gray-800 text-xs" title="Collapse">▲</button>
                    <button onClick={onHide} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                  {incident.incident_type} — Priority: {incident.priority}
                </div>
                <div className="mt-2">
                  <EscalationTimer
                    incidentId={incident.id.toString()}
                    escalationLevel={incident.escalation_level || 0}
                    escalateAt={incident.escalate_at}
                    priority={incident.priority}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                  {incident.occurrence}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={onMoveToInProgress} className="px-3 py-1.5 rounded bg-yellow-500 text-white text-xs hover:bg-yellow-600">Move to In-Progress</button>
              <button onClick={onAddInfo} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">Add Info</button>
              <button onClick={onCloseLog} className="ml-auto px-3 py-1.5 rounded bg-red-600 text-white text-xs hover:bg-red-700">Close Log</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


