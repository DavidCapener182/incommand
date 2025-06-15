"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

// Initial groupings and roles as per user specification
const initialGroups = [
  {
    group: "Management",
    positions: [
      { id: "a1", callsign: "ALPHA 1", short: "A1", position: "HOS" },
      { id: "a2", callsign: "ALPHA 2", short: "A2", position: "Site Co" },
      { id: "a3", callsign: "ALPHA 3", short: "A3", position: "Internal Co" },
    ],
  },
  {
    group: "External",
    positions: [
      { id: "a4", callsign: "ALPHA 4", short: "A4", position: "Queue Management" },
      { id: "s1", callsign: "SIERRA 1", short: "S1", position: "Search Supervisor" },
      { id: "s7", callsign: "SIERRA 7", short: "S7", position: "Access Escort" },
      { id: "s8", callsign: "SIERRA 8", short: "S8", position: "Hotel Gate" },
      { id: "s12", callsign: "SIERRA 12", short: "S12", position: "Side Gate" },
      { id: "s16", callsign: "SIERRA 16", short: "S16", position: "E3 Car Park" },
    ],
  },
  {
    group: "Internal",
    positions: [
      { id: "s2", callsign: "SIERRA 2", short: "S2", position: "BOH Supervisor" },
      { id: "s3", callsign: "SIERRA 3", short: "S3", position: "Pit Supervisor" },
      { id: "s4", callsign: "SIERRA 4", short: "S4", position: "Mezzanine" },
      { id: "s5", callsign: "SIERRA 5", short: "S5", position: "Stage Right" },
      { id: "s6", callsign: "SIERRA 6", short: "S6", position: "Stage Left" },
      { id: "s9", callsign: "SIERRA 9", short: "S9", position: "Mezzanine Clicker" },
      { id: "s10", callsign: "SIERRA 10", short: "S10", position: "Mixer" },
      { id: "s11", callsign: "SIERRA 11", short: "S11", position: "BOH Fire Exits" },
      { id: "s15", callsign: "SIERRA 15", short: "S15", position: "Cloakroom" },
      { id: "response1", callsign: "RESPONSE 1", short: "R1", position: "Response" },
    ],
  },
  {
    group: "Venue Operations",
    positions: [
      { id: "dm", callsign: "DELTA MIKE", short: "DM", position: "Duty Manager" },
      { id: "pm", callsign: "PAPA MIKE", short: "PM", position: "Production Manager" },
    ],
  },
  {
    group: "Medical",
    positions: [
      { id: "medic1", callsign: "MEDIC 1", short: "M1", position: "Medic" },
      { id: "medic2", callsign: "MEDIC 2", short: "M2", position: "Medic" },
    ],
  },
  {
    group: "Traffic Management",
    positions: [
      { id: "tm1", callsign: "TM 1", short: "TM1", position: "Traffic Management" },
    ],
  },
];

function getNewId() {
  return `id_${Math.random().toString(36).substr(2, 9)}`;
}

export default function CallsignAssignmentPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [currentName, setCurrentName] = useState("");
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});
  const [editGroup, setEditGroup] = useState<string | null>(null);
  const [editPositions, setEditPositions] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({ callsign: "", short: "", position: "" });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Placeholder event_id (replace with real event selection logic)
  const event_id = "demo-event-id";

  // Assignment logic
  const handleAssign = (posId: string) => {
    if (!currentName.trim()) return;
    setAssignments({ ...assignments, [posId]: currentName.trim() });
    setCurrentName("");
  };

  // Edit logic
  const handleEditClick = (groupName: string, positions: any[]) => {
    setEditGroup(groupName);
    setEditPositions(positions.map((p) => ({ ...p })));
    setNewRole({ callsign: "", short: "", position: "" });
  };

  const handleEditChange = (idx: number, field: string, value: string) => {
    setEditPositions(editPositions.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const handleRemoveRole = (idx: number) => {
    setEditPositions(editPositions.filter((_, i) => i !== idx));
  };

  const handleAddRole = () => {
    if (!newRole.callsign.trim() || !newRole.short.trim() || !newRole.position.trim()) return;
    setEditPositions([...editPositions, { ...newRole, id: getNewId() }]);
    setNewRole({ callsign: "", short: "", position: "" });
  };

  const handleSaveEdit = () => {
    setGroups(groups.map((g) => (g.group === editGroup ? { ...g, positions: editPositions } : g)));
    setEditGroup(null);
    setEditPositions([]);
  };

  // Save all roles and assignments to Supabase
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // Flatten roles for upsert
      const roles = groups.flatMap(group =>
        group.positions.map(pos => ({
          event_id,
          area: group.group,
          short_code: pos.short,
          callsign: pos.callsign,
          position: pos.position,
          // Use existing or generate a stable id for upsert
          id: pos.id && pos.id.startsWith('id_') ? undefined : pos.id,
        }))
      );
      // Upsert roles (callsign_roles)
      const { data: upsertedRoles, error: rolesError } = await supabase
        .from("callsign_roles")
        .upsert(roles, { onConflict: "id" })
        .select();
      if (rolesError) throw rolesError;

      // Map UI pos.id to DB id
      const idMap: Record<string, string> = {};
      upsertedRoles?.forEach((r: any) => {
        // Try to match by callsign/short_code/area/position
        const match = groups
          .find(g => g.group === r.area)
          ?.positions.find(
            p =>
              p.callsign === r.callsign &&
              p.short === r.short_code &&
              p.position === r.position
          );
        if (match) idMap[match.id] = r.id;
      });

      // Prepare assignments for upsert
      const assignmentsArr = Object.entries(assignments).map(([posId, assigned_name]) => ({
        event_id,
        callsign_role_id: idMap[posId],
        assigned_name,
      }));
      if (assignmentsArr.length > 0) {
        const { error: assignError } = await supabase
          .from("callsign_assignments")
          .upsert(assignmentsArr, { onConflict: "event_id,callsign_role_id" });
        if (assignError) throw assignError;
      }
      setSaveStatus("Saved successfully!");
    } catch (err: any) {
      setSaveStatus("Error saving: " + (err.message || err.toString()));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Callsign Assignment Sheet (Concert)</h1>
      <div className="mb-4 flex gap-4 items-center">
        <button
          className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 disabled:opacity-50"
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All"}
        </button>
        {saveStatus && <span className="ml-4 text-sm font-semibold text-green-700">{saveStatus}</span>}
      </div>
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Name to Assign</label>
          <input
            className="border px-3 py-2 rounded w-full"
            placeholder="Enter name to assign"
            value={currentName}
            onChange={e => setCurrentName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
          />
        </div>
        <div className="text-gray-500 italic">Click a callsign to assign</div>
      </div>
      {groups.map(group => (
        <div key={group.group} className="mb-8">
          <div className="flex items-center mb-2">
            <h2 className="font-semibold text-lg flex-1">{group.group}</h2>
            {editGroup === group.group ? (
              <>
                <button className="px-3 py-1 bg-green-600 text-white rounded mr-2" onClick={handleSaveEdit}>Save</button>
                <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={() => setEditGroup(null)}>Cancel</button>
              </>
            ) : (
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleEditClick(group.group, group.positions)}>Edit</button>
            )}
          </div>
          {editGroup === group.group ? (
            <div className="space-y-2">
              {editPositions.map((pos, idx) => (
                <div key={pos.id} className="flex gap-2 items-center">
                  <input
                    className="border px-2 py-1 rounded w-28 font-mono"
                    value={pos.callsign}
                    onChange={e => handleEditChange(idx, "callsign", e.target.value)}
                    placeholder="Full Callsign"
                  />
                  <input
                    className="border px-2 py-1 rounded w-14 font-mono"
                    value={pos.short}
                    onChange={e => handleEditChange(idx, "short", e.target.value)}
                    placeholder="Short"
                  />
                  <input
                    className="border px-2 py-1 rounded w-40"
                    value={pos.position}
                    onChange={e => handleEditChange(idx, "position", e.target.value)}
                    placeholder="Role Name"
                  />
                  <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleRemoveRole(idx)}>Remove</button>
                </div>
              ))}
              <div className="flex gap-2 items-center mt-2">
                <input
                  className="border px-2 py-1 rounded w-28 font-mono"
                  value={newRole.callsign}
                  onChange={e => setNewRole({ ...newRole, callsign: e.target.value })}
                  placeholder="Full Callsign"
                />
                <input
                  className="border px-2 py-1 rounded w-14 font-mono"
                  value={newRole.short}
                  onChange={e => setNewRole({ ...newRole, short: e.target.value })}
                  placeholder="Short"
                />
                <input
                  className="border px-2 py-1 rounded w-40"
                  value={newRole.position}
                  onChange={e => setNewRole({ ...newRole, position: e.target.value })}
                  placeholder="Role Name"
                />
                <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={handleAddRole}>Add</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.positions.map(pos => (
                <button
                  key={pos.id}
                  className={`flex items-center bg-gray-50 p-3 rounded shadow border transition hover:bg-blue-50 focus:outline-none ${assignments[pos.id] ? 'border-blue-500' : 'border-gray-200'}`}
                  onClick={() => handleAssign(pos.id)}
                  disabled={!currentName.trim()}
                >
                  <span className="w-32 font-mono text-blue-700">
                    {pos.callsign} <span className="text-xs text-gray-500">({pos.short})</span>
                  </span>
                  <span className="w-56 text-gray-700">{pos.position}</span>
                  <span className="ml-auto font-semibold">
                    {assignments[pos.id] ? assignments[pos.id] : <span className="text-gray-400">(Unassigned)</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 