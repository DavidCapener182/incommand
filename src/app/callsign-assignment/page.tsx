"use client";

import React, { useState, useEffect } from "react";
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
      { id: "s1", callsign: "SIERRA 1", short: "S1", position: "Queue Management" },
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
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [previousNames, setPreviousNames] = useState<Record<string, string[]>>({});
  const [allPreviousNames, setAllPreviousNames] = useState<string[]>([]);

  // Fetch current event on mount
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      setEventLoading(true);
      setEventError(null);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, event_name")
          .eq("is_current", true)
          .single();
        if (error) throw error;
        if (!data) {
          setEventError("No current event found. Please set a current event in Settings.");
          setEventId(null);
          setEventName("");
        } else {
          setEventId(data.id);
          setEventName(data.event_name || "");
        }
      } catch (err: any) {
        setEventError("Error loading event: " + (err.message || err.toString()));
        setEventId(null);
        setEventName("");
      } finally {
        setEventLoading(false);
      }
    };
    fetchCurrentEvent();
  }, []);

  // Load roles and assignments from Supabase when eventId changes
  useEffect(() => {
    if (!eventId) return;
    const loadRolesAndAssignments = async () => {
      setSaveStatus("Loading saved callsigns...");
      // Load roles
      const { data: roles, error: rolesError } = await supabase
        .from("callsign_roles")
        .select("id, area, short_code, callsign, position")
        .eq("event_id", eventId);
      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("callsign_assignments")
        .select("callsign_role_id, assigned_name")
        .eq("event_id", eventId);
      if (rolesError || assignmentsError) {
        setSaveStatus("Error loading saved data");
        return;
      }
      if (roles && roles.length > 0) {
        // Group roles by area
        const grouped: typeof groups = [];
        const areaMap: Record<string, any[]> = {};
        roles.forEach((r) => {
          if (!areaMap[r.area]) areaMap[r.area] = [];
          areaMap[r.area].push({
            id: r.id,
            callsign: r.callsign,
            short: r.short_code,
            position: r.position,
          });
        });
        for (const area in areaMap) {
          grouped.push({ group: area, positions: areaMap[area] });
        }
        setGroups(grouped);
      } else {
        setGroups(initialGroups);
      }
      if (assignmentsData && assignmentsData.length > 0) {
        // Map assignments by callsign_role_id
        const assignMap: Record<string, string> = {};
        assignmentsData.forEach((a) => {
          assignMap[a.callsign_role_id] = a.assigned_name;
        });
        setAssignments(assignMap);
      } else {
        setAssignments({});
      }
      setSaveStatus(null);
    };
    loadRolesAndAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Fetch previous unique names for each callsign_role_id (excluding current event)
  useEffect(() => {
    if (!eventId) return;
    const fetchPreviousNames = async () => {
      // Get all previous assignments for all roles, excluding current event
      const { data, error } = await supabase
        .from("callsign_assignments")
        .select("callsign_role_id, assigned_name, assigned_at")
        .neq("event_id", eventId)
        .order("assigned_at", { ascending: false });
      if (error) return;
      // Map: callsign_role_id -> unique names (most recent first)
      const map: Record<string, string[]> = {};
      data?.forEach((row) => {
        if (!row.assigned_name) return;
        if (!map[row.callsign_role_id]) map[row.callsign_role_id] = [];
        if (!map[row.callsign_role_id].includes(row.assigned_name)) {
          map[row.callsign_role_id].push(row.assigned_name);
        }
      });
      setPreviousNames(map);
    };
    fetchPreviousNames();
  }, [eventId]);

  // Fetch all unique assigned names ever used (across all callsigns/events)
  useEffect(() => {
    const fetchAllNames = async () => {
      const { data, error } = await supabase
        .from("callsign_assignments")
        .select("assigned_name")
        .not("assigned_name", "is", null);
      if (error) return;
      const names = Array.from(new Set((data || []).map((row) => row.assigned_name).filter(Boolean)));
      setAllPreviousNames(names);
    };
    fetchAllNames();
  }, []);

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
    if (!eventId) {
      setSaveStatus("No current event selected.");
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    try {
      // Helper to check for valid UUID
      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      // Flatten roles for upsert
      const roles = groups.flatMap(group =>
        group.positions.map(pos => {
          const base = {
            event_id: eventId,
            area: group.group,
            short_code: pos.short,
            callsign: pos.callsign,
            position: pos.position,
          };
          // Only include id if it's a valid UUID
          if (pos.id && isUUID(pos.id)) {
            return { ...base, id: pos.id };
          }
          return base;
        })
      );
      const { data: upsertedRoles, error: rolesError } = await supabase
        .from("callsign_roles")
        .upsert(roles, { onConflict: "event_id,area,short_code" })
        .select();
      if (rolesError) throw rolesError;
      const idMap: Record<string, string> = {};
      upsertedRoles?.forEach((r: any) => {
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
      const assignmentsArr = Object.entries(assignments).map(([posId, assigned_name]) => ({
        event_id: eventId,
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

  // Filtered groups based on search
  const filteredGroups = groups.map(group => ({
    ...group,
    positions: group.positions.filter(pos => {
      const searchLower = search.toLowerCase();
      return (
        // removed pos.name, only use assignments for assigned status
        pos.position?.toLowerCase().includes(searchLower) ||
        pos.callsign?.toLowerCase().includes(searchLower) ||
        pos.short?.toLowerCase().includes(searchLower)
      );
    })
  })).filter(group => group.positions.length > 0);

  // Status color helper
  const getStatusColor = (pos: any) => {
    if (assignments[pos.id]) return "bg-green-500"; // assigned
    if (pos.pending) return "bg-amber-400"; // pending/temporary
    return "bg-gray-300"; // unassigned
  };

  if (eventLoading) {
    return <div className="max-w-5xl mx-auto py-8 text-lg">Loading current event...</div>;
  }
  if (eventError) {
    return <div className="max-w-5xl mx-auto py-8 text-red-600 font-semibold">{eventError}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Callsign Assignment Sheet{eventName ? ` — ${eventName}` : ""}</h1>
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
      <input
        type="text"
        placeholder="Search by name, role, or callsign..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring"
      />
      {filteredGroups.map(group => (
        <div key={group.group} className="mb-6">
          <div className="flex items-center mb-2">
            <h3 className="font-bold text-lg flex-1">{group.group}</h3>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {group.positions.map((pos: any) => (
                <button
                  key={pos.short}
                  className={`flex items-center gap-2 p-3 bg-white rounded shadow border w-full text-left transition ${currentName.trim() ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed'} ${assignments[pos.id] ? 'border-blue-500' : 'border-gray-200'}`}
                  onClick={() => {
                    if (!currentName.trim() || editGroup === group.group) return;
                    handleAssign(pos.id);
                  }}
                  disabled={!currentName.trim() || editGroup === group.group}
                >
                  <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(pos)}`}></span>
                  <span className="font-semibold">{pos.short}</span>
                  <span className="text-gray-400">{pos.position}</span>
                  {assignments[pos.id] ? (
                    <span className="ml-auto text-sm text-gray-700">{assignments[pos.id]}</span>
                  ) : (
                    <span className="ml-auto text-sm text-gray-400 flex items-center gap-1 italic">
                      Unassigned
                      {(() => {
                        const prevNames = previousNames[pos.id] || [];
                        const prevNamesNoAssigned = prevNames.filter(n => n);
                        const shownNames = new Set(prevNamesNoAssigned);
                        const otherNames = allPreviousNames.filter(n => n && !shownNames.has(n)).sort((a, b) => a.localeCompare(b));
                        return (
                          <select
                            className="ml-1 border rounded px-1 py-0.5 text-xs bg-gray-50 min-w-[90px] max-w-[120px] focus:outline-none"
                            style={{ fontSize: '0.85rem', height: '1.7rem' }}
                            onChange={e => {
                              if (e.target.value) {
                                setCurrentName(e.target.value === '__unassigned__' ? '' : e.target.value);
                                handleAssign(pos.id);
                              }
                            }}
                            value={"__unassigned__"}
                          >
                            <option value="__unassigned__">Unassigned</option>
                            {prevNamesNoAssigned.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            {prevNamesNoAssigned.length > 0 && otherNames.length > 0 && (
                              <option disabled>----------</option>
                            )}
                            {otherNames.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 