"use client";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FaUpload } from "react-icons/fa";
import SignaturePad from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportsPage() {
  const [event, setEvent] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [headOfSecurity, setHeadOfSecurity] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [incidentReportFile, setIncidentReportFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sigPadRef = useRef<any>(null);
  const [staffBriefingTime, setStaffBriefingTime] = useState<string>("-");
  const [showdownTime, setShowdownTime] = useState<string>("-");

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
      // Get logs
      const { data: logs } = await supabase
        .from("event_logs")
        .select("*")
        .eq("event_id", event?.id || "")
        .order("timestamp", { ascending: true });
      setLogs(logs || []);
      // Staff Briefed & In Position time (check occurrence and details)
      const staffBriefedLog = (logs || []).find(
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
      const showdownLog = (logs || []).find(
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
      // Get incidents
      const { data: incidents } = await supabase
        .from("incident_logs")
        .select("*")
        .eq("event_id", event?.id || "")
        .order("timestamp", { ascending: true });
      // Add showdown incident if showdownLog exists
      let allIncidents = incidents || [];
      if (showdownLog) {
        allIncidents = [
          ...allIncidents,
          {
            incident_type: "Event Timing",
            incident_title: "Showdown",
            timestamp: showdownLog.timestamp,
            details: "The show has ended",
            occurrence: "Showdown",
            callsign: "PM",
          },
        ];
      }
      setIncidents(allIncidents);

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

  // Incident summary for each
  function incidentSummary(inc: any) {
    const time = inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
    const info = inc.details || inc.description || inc.occurrence || "No details";
    // Show incident_title if present, otherwise incident_type
    const title = inc.incident_title || inc.incident_type;
    return <span><b>{title} ({time})</b> - {info}</span>;
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 bg-white shadow rounded-lg mt-8">
      <h1 className="text-2xl font-bold mb-6">End of Event Report</h1>
      <form onSubmit={handleSubmit} className="space-y-6" id="event-report-pdf">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Head of Security</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={headOfSecurity}
              onChange={(e) => setHeadOfSecurity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Date of Event</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={event ? new Date(event.event_date).toLocaleDateString() : "-"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Event Name</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={event?.event_name || "-"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Staff Briefed & In Position</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={getLogTime('staff briefed')}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Doors Open Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={doorsOpenTime}
              readOnly
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Support Act(s)</label>
          <ul className="list-disc ml-6">
            {supportActs.length ? supportActs.map((act, i) => {
              if ('act_name' in act) {
                // Event support act
                return <li key={i}>{act.act_name} {act.start_time ? `(${act.start_time})` : ""}</li>;
              } else {
                // Log entry
                const logAct = act as any;
                return <li key={i}>{logAct.details ? logAct.details : ""} {logAct.timestamp ? `(${new Date(logAct.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}</li>;
              }
            }) : <li>-</li>}
          </ul>
        </div>
        <div>
          <label className="block text-sm font-medium">Main Act</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={mainActName !== "-" ? `${mainActName}${mainActTime && mainActTime !== "-" ? ` (${mainActTime})` : ""}` : "-"}
            readOnly
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Showdown Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={showdownTime}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Venue Clear Time</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={venueClearTime}
              readOnly
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Incident Summary</label>
          <div className="bg-gray-50 border rounded p-4 min-h-[60px]">
            {renderSummary(aiSummary)}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Incident List</label>
          <ul className="list-disc ml-6">
            {filteredIncidents.length ? filteredIncidents.map((inc, i) => (
              <li key={i}>{incidentSummary(inc)}</li>
            )) : <li>No incidents recorded.</li>}
          </ul>
        </div>
        <div>
          <label className="block text-sm font-medium">Upload Incident Report</label>
          <div className="flex items-center gap-2">
            <input type="file" onChange={handleFileChange} className="block" />
            {incidentReportFile && <span className="text-xs">{incidentReportFile.name}</span>}
            <FaUpload className="text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Signature (type your name)</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Signature (scribble)</label>
          <div className="border rounded bg-white p-2">
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