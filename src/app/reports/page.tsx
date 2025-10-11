"use client";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FaUpload } from "react-icons/fa";
import SignaturePad from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import OpenAI from "openai";

export default function ReportsPage() {
  const [event, setEvent] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [headOfSecurity, setHeadOfSecurity] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [incidentReportFile, setIncidentReportFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigPadRef = useRef<any>(null);
  const [staffBriefingTime, setStaffBriefingTime] = useState<string>("-");
  const [showdownTime, setShowdownTime] = useState<string>("-");
  const [callsignAssignments, setCallsignAssignments] = useState<Record<string, string>>({});
  const [callsignShortToName, setCallsignShortToName] = useState<Record<string, string>>({});
  const [allLogs, setAllLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Get current event
      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("is_current", true)
        .single();
      setEvent(event);
      setHeadOfSecurity(event?.head_of_security || event?.head_of_security_name || "");
      // Get event logs
      const { data: eventLogs } = await supabase
        .from("event_logs")
        .select("*")
        .eq("event_id", event?.id || "")
        .order("timestamp", { ascending: true });
      // Get incident logs
      const { data: incidentLogs } = await supabase
        .from("incident_logs")
        .select("*")
        .eq("event_id", event?.id || "")
        .order("timestamp", { ascending: true });
      setLogs(eventLogs || []); // keep for legacy use
      // Add showdown incident if showdownLog exists (legacy)
      let allIncidents = incidentLogs || [];
      setIncidents(allIncidents);
      // Merge logs for All Logs section
      let mergedLogs = [
        ...(eventLogs || []).map(l => ({ ...l, _source: 'event_logs' })),
        ...(incidentLogs || []).map(l => ({ ...l, _source: 'incident_logs' }))
      ];
      // Exclude attendance logs
      mergedLogs = mergedLogs.filter(l => (l.type || l.incident_type) !== 'Attendance');
      // Sort by timestamp
      mergedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setAllLogs(mergedLogs);
      // Staff Briefed & In Position time (check occurrence and details)
      const staffBriefedLog = (eventLogs || []).find(
        (log: any) =>
          log.type === "Sit Rep" &&
          ((log.occurrence && log.occurrence.toLowerCase().includes("staff briefed and in position")) ||
           (log.details && log.details.toLowerCase().includes("staff briefed and in position")))
      );
      if (staffBriefedLog) {
        // Try to extract time from occurrence/details, fallback to log.timestamp
        let match = staffBriefedLog.occurrence?.match(/at (\d{1,2}:\d{2})/);
        if (!match && staffBriefedLog.details) {
          match = staffBriefedLog.details.match(/at (\d{1,2}:\d{2})/);
        }
        setStaffBriefingTime(match ? match[1] : new Date(staffBriefedLog.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setStaffBriefingTime("-");
      }
      // Showdown time (check occurrence and details)
      const showdownLog = (eventLogs || []).find(
        (log: any) =>
          log.type === "Sit Rep" &&
          log.from === "PM" &&
          ((log.occurrence && log.occurrence.toLowerCase().includes("showdown")) ||
           (log.details && log.details.toLowerCase().includes("showdown")))
      );
      if (showdownLog) {
        setShowdownTime(new Date(showdownLog.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setShowdownTime("-");
      }
      // Showdown Time: use Event Timing incident if present
      const showdownIncident = allIncidents.find(
        (inc: any) => inc.incident_type === "Event Timing" && inc.occurrence === "Showdown"
      );
      if (showdownIncident) {
        setShowdownTime(new Date(showdownIncident.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else if (showdownLog) {
        setShowdownTime(new Date(showdownLog.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setShowdownTime("-");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!event) return;
    const fetchAssignments = async () => {
      const { data: roles } = await supabase
        .from('callsign_positions')
        .select('id, short_code, callsign')
        .eq('event_id', event.id);
      const { data: assignments } = await supabase
        .from('callsign_assignments')
        .select('callsign_role_id, assigned_name')
        .eq('event_id', event.id);
      const idToShort: Record<string, string> = {};
      const idToCallsign: Record<string, string> = {};
      roles?.forEach((r) => {
        idToShort[r.id] = r.short_code;
        idToCallsign[r.id] = r.callsign;
      });
      const shortToName: Record<string, string> = {};
      const callsignToName: Record<string, string> = {};
      assignments?.forEach((a) => {
        const short = idToShort[a.callsign_role_id];
        const cs = idToCallsign[a.callsign_role_id];
        if (short) shortToName[short.toUpperCase()] = a.assigned_name;
        if (cs) callsignToName[cs.toUpperCase()] = a.assigned_name;
      });
      setCallsignAssignments(callsignToName);
      setCallsignShortToName(shortToName);
    };
    fetchAssignments();
  }, [event]);

  // Get event date: use today's date or the date of the first log
  const eventDate = allLogs.length > 0
    ? new Date(allLogs[0].timestamp).toLocaleDateString()
    : new Date().toLocaleDateString();

  // Get venue name from current event (if available)
  // Assume you have a variable or prop called 'venueName' or similar
  // If not, fallback to '-'
  const venueName = event?.venue || '-';

  // When fetching/generating the AI summary, replace [insert date] and [insert venue] in the prompt
  useEffect(() => {
    const fetchAiSummary = async () => {
      setLoadingSummary(true);
      try {
        const response = await fetch("/api/notifications/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `You are an event report assistant. Write a strictly factual, 2-paragraph summary of the incidents for this event, using ONLY the actual incident logs provided below. Do not add, infer, or embellish any details. If there are no incidents, state that clearly. Do not mention attendance tracking or any event details not present in the logs. Here are the incident logs:\n${JSON.stringify(incidents)}\nDate: ${eventDate}, Venue: ${venueName}.`
          }),
        });
        const data = await response.json();
        setAiSummary(data.summary || "No summary generated.");
      } catch (error) {
        setAiSummary("No summary generated.");
      }
      setLoadingSummary(false);
    };
    fetchAiSummary();
  }, [eventDate, venueName, allLogs, incidents]);

  // Extract times and details from logs or incidents
  const getLogTime = (keyword: string) => {
    const normKeyword = keyword.toLowerCase();
    const incident = incidents.find((inc) => {
      if (!inc.incident_type || !inc.occurrence) return false;
      const occ = inc.occurrence.toLowerCase();
      if (normKeyword.includes("venue clear")) {
        return (
          (inc.incident_type === "Event Timing" || inc.incident_type === "Timings") &&
          (occ.includes("venue clear") || occ.includes("venue is clear of public"))
        );
      }
      if (normKeyword.includes("staff briefed")) {
        return (
          (inc.incident_type === "Event Timing" || inc.incident_type === "Timings") &&
          (occ.includes("staff briefed") || occ.includes("staff fully briefed and in position ready for doors"))
        );
      }
      return (
        (inc.incident_type === "Event Timing" || inc.incident_type === "Timings") &&
        occ.includes(normKeyword)
      );
    });
    if (incident) {
      return incident.timestamp
        ? new Date(incident.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "-";
    }
    const log = logs.find((l) => l.details?.toLowerCase().includes(normKeyword));
    return log
      ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "-";
  };
  // Support acts from event table if available, else logs
  let supportActs: { act_name: string; start_time: string }[] = [];
  try {
    supportActs = event?.support_acts ? JSON.parse(event.support_acts) : [];
  } catch {
    supportActs = [];
  }
  if (!supportActs.length) {
    supportActs = logs.filter((l) => l.details?.toLowerCase().includes("support act"));
  }
  // Main act from event table
  const mainActName = event?.artist_name || "-";
  const mainActTime = event?.main_act_start_time || "-";
  // Showdown and venue clear
  const venueClearTime = getLogTime("venue clear");
  // Doors open
  const doorsOpenTime = getLogTime("doors open");

  // AI summary of incidents (format as list if possible)
  function renderSummary(text: string) {
    if (!text) return <span className="text-gray-400">No incidents to summarize.</span>;
    // Try to split on numbered or dash lists
    const lines = text.split(/\n| - |\d+\. /).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return <ul className="list-disc ml-6">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>;
    }
    return <span>{text}</span>;
  }

  // Filter incidents for the list
  const filteredIncidents = incidents.filter(
    (inc) => inc.incident_type !== "Sit Rep" && inc.incident_type !== "Attendance"
  );

  // Filter logs for the all-logs list (exclude attendance)
  const filteredLogs = logs.filter(
    (log) => log.type !== "Attendance"
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Incident summary for each
  function incidentSummary(inc: any) {
    const time = inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
    const info = inc.details || inc.description || inc.occurrence || "No details";
    // Show incident_title if present, otherwise incident_type
    const title = inc.incident_title || inc.incident_type;
    // Tooltip for callsign_from
    const callsignFrom = inc.callsign_from ? (
      <span
        title={
          callsignShortToName[inc.callsign_from?.toUpperCase()] ||
          callsignAssignments[inc.callsign_from?.toUpperCase()] ||
          undefined
        }
        className="underline decoration-dotted cursor-help"
      >
        {inc.callsign_from}
      </span>
    ) : null;
    return <span><b>{title} ({time})</b> - {info} {callsignFrom}</span>;
  }

  // Log summary for each log (reuse incidentSummary style)
  function logSummary(log: any) {
    const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
    const info = log.details || log.occurrence || "No details";
    const title = log.type || "Log";
    // Tooltip for from/callsign
    const callsignFrom = log.from ? (
      <span
        title={
          callsignShortToName[log.from?.toUpperCase()] ||
          callsignAssignments[log.from?.toUpperCase()] ||
          undefined
        }
        className="underline decoration-dotted cursor-help"
      >
        {log.from}
      </span>
    ) : null;
    return <span><b>{title} ({time})</b> - {info} {callsignFrom}</span>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIncidentReportFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Upload file, save report, etc.
    setTimeout(() => setSubmitting(false), 1500);
    alert("Report submitted!");
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    const report = document.getElementById("event-report-pdf");
    if (!report) return;
    const canvas = await html2canvas(report);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Scale image to fit page width
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight > pageHeight ? pageHeight : pdfHeight);
    pdf.save(`EndOfEventReport-${event?.event_name || "event"}.pdf`);
  };

  // Improved extraction for Doors Open Time and Staff Briefed & In Position
  function getDoorsOpenTime() {
    const match = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes('doors green') || text.includes('doors open') || text.includes('doors are open');
      }
    );
    return match && match.timestamp ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  }
  function getStaffBriefedTime() {
    const match = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes('staff briefed') || text.includes('staff briefed and in position') || text.includes('staff fully briefed and in position ready for doors');
      }
    );
    return match && match.timestamp ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  }

  function getShowdownTime() {
    const match = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes('showdown');
      }
    );
    return match && match.timestamp ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  }
  function getVenueClearTime() {
    const match = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes('venue clear') || text.includes('venue is clear of public');
      }
    );
    return match && match.timestamp ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  }

  // Helper to get on/off times for a support act from logs
  function getSupportActTimes(actName: string) {
    const onLog = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes(`${actName.toLowerCase()} on`);
      }
    );
    const offLog = allLogs.find(
      (log) => {
        const text = (log.details || log.occurrence || '').toLowerCase();
        return text.includes(`${actName.toLowerCase()} off`);
      }
    );
    const onTime = onLog && onLog.timestamp ? new Date(onLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    const offTime = offLog && offLog.timestamp ? new Date(offLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    return { onTime, offTime };
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 bg-white dark:bg-[#23408e] shadow rounded-lg mt-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">End of Event Report</h1>
      <form onSubmit={handleSubmit} className="space-y-6" id="event-report-pdf">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Head of Security</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={headOfSecurity}
              onChange={(e) => setHeadOfSecurity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Date of Event</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={event ? new Date(event.event_date).toLocaleDateString() : "-"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Event Name</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={event?.event_name || "-"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Staff Briefed & In Position</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={getStaffBriefedTime()}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Doors Open Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={getDoorsOpenTime()}
              readOnly
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Support Act(s)</label>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-[#2d437a] rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-100 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Act Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">On Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Off Time</th>
                </tr>
              </thead>
              <tbody>
                {supportActs.length ? supportActs.map((act, i) => {
                  if ('act_name' in act) {
                    const { onTime, offTime } = getSupportActTimes(act.act_name);
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-[#1a2a4f]' : 'bg-white dark:bg-[#23408e]'}>
                        <td className="px-4 py-2 whitespace-nowrap">{act.act_name}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{onTime || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{offTime || '-'}</td>
                      </tr>
                    );
                  } else {
                    // Log entry fallback
                    const logAct = act as any;
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-[#1a2a4f]' : 'bg-white dark:bg-[#23408e]'}>
                        <td className="px-4 py-2 whitespace-nowrap">{logAct.details || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{logAct.timestamp ? new Date(logAct.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">-</td>
                      </tr>
                    );
                  }
                }) : (
                  <tr><td colSpan={3} className="text-center py-4">No support acts recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Main Act</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
            value={mainActName !== "-" ? `${mainActName}${mainActTime && mainActTime !== "-" ? ` (${mainActTime})` : ""}` : "-"}
            readOnly
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Showdown Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={getShowdownTime()}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white">Venue Clear Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
              value={getVenueClearTime()}
              readOnly
            />
          </div>
        </div>
        <div className="mt-6">
          <div className="font-bold text-lg mb-2">Post-Event Incident Summary</div>
          {loadingSummary ? (
            <div className="text-gray-500">Loading summary...</div>
          ) : aiSummary ? (
            aiSummary
              .replace(/\*\*/g, '') // Remove markdown bold
              .split(/\n\n|(?<=\.)\n/) // Split into paragraphs
              .filter(Boolean)
              .map((para, idx) => (
                <p key={idx} className="mb-3 whitespace-pre-line text-gray-900 dark:text-gray-100">{para.trim()}</p>
              ))
          ) : (
            <div className="text-gray-500">No summary generated.</div>
          )}
        </div>
        {/* All logs except attendance, in chronological order, as a table */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mt-6">All Logs (excluding Attendance)</label>
          <div className="border border-gray-200 dark:border-[#2d437a] rounded-lg overflow-hidden max-h-96 overflow-y-auto scroll-smooth">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#1a2a57] shadow-sm border-b border-gray-200 dark:border-[#2d437a]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Type</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider whitespace-nowrap" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-blue-100 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {allLogs.length ? allLogs.map((log, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-[#1a2a4f]' : 'bg-white dark:bg-[#23408e]'}>
                    <td className="px-4 py-2 whitespace-nowrap">{log.type || log.incident_type || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-2">{log.details || log.occurrence || log.description || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-4">No logs recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Upload Incident Report</label>
          <div className="flex items-center gap-2">
            <input type="file" onChange={handleFileChange} className="block dark:bg-[#1a2a4f] dark:text-white" />
            {incidentReportFile && <span className="text-xs dark:text-white">{incidentReportFile.name}</span>}
            <FaUpload className="text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Signature (type your name)</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2 dark:bg-[#1a2a4f] dark:text-white"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Signature (scribble)</label>
          <div className="border rounded bg-white dark:bg-[#1a2a4f] p-2">
            <SignaturePad
              ref={sigPadRef}
              canvasProps={{ width: 350, height: 100, className: "border rounded bg-gray-50" }}
            />
            <button type="button" className="mt-2 text-xs text-blue-600 underline" onClick={() => sigPadRef.current?.clear()}>Clear</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300"
            onClick={handleDownloadPDF}
          >
            Download as PDF
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </main>
  );
} 
