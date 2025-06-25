"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserGroupIcon, KeyIcon, DevicePhoneMobileIcon, CalendarDaysIcon, IdentificationIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from "next/link";

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

// Placeholder components for new sections
const StaffList = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Staff List view coming soon...</div>
);
const RadioSignOut = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Radio Sign Out view coming soon...</div>
);
const ShiftRoster = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Shift Roster view coming soon...</div>
);
const Accreditation = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Accreditation view coming soon...</div>
);

const navItems = [
  { name: 'Staff List', icon: UserGroupIcon, key: 'staff' },
  { name: 'Callsign Assignment', icon: KeyIcon, key: 'callsign' },
  { name: 'Radio Sign Out', icon: DevicePhoneMobileIcon, key: 'radio' },
  { name: 'Shift Roster', icon: CalendarDaysIcon, key: 'shift' },
  { name: 'Accreditation', icon: IdentificationIcon, key: 'accreditation' },
  { name: 'Staff Management', key: 'staff-management', icon: UserGroupIcon },
];

const SKILL_OPTIONS = [
  "Head of Security (HOS)",
  "Deputy Head of Security",
  "Security Manager",
  "Supervisor",
  "SIA Security Officer",
  "Response Team (SIA)",
  "Event Steward",
  "Control Room Operator",
  "Event Control Manager",
  "Radio Controller",
  "Callsign Coordinator",
  "Welfare Officer",
  "Welfare Team",
  "Safeguarding Lead",
  "Medic / Paramedic",
  "Medical Coordinator",
  "Traffic Marshal",
  "Road Closure Operative",
  "Venue Manager",
  "Duty Manager",
  "Site Manager",
  "Access Control",
  "Accreditation",
  "Production Manager",
  "Stage Manager",
  "Artist Liaison",
  "Front of House",
  "Turnstile Operator",
  "Fire Safety Marshal",
  "Health & Safety",
  "Dog Handler (K9)",
  "CCTV Operator",
  "Logistics Coordinator",
  "Cleaner/Housekeeping"
];

// Add this type above StaffListView
type StaffForm = {
  full_name: string;
  contact_number: string;
  email: string;
  skill_tags: string[];
  notes: string;
  active: boolean;
};

export default function StaffCommandCentre() {
  const [activeView, setActiveView] = useState('callsign');
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#101c36] transition-colors duration-300">
      {/* Sidebar - pixel-perfect match to settings sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex-col shadow-lg z-10">
        {/* Top bar with section title */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Staff Command Centre</span>
          </div>
        </div>
        {/* Navigation items */}
        <nav className="flex-1 space-y-2 py-4 px-2">
          {navItems.map((item) => {
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors w-full text-left
                  ${isActive ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
                aria-current={isActive ? 'page' : undefined}
                title={item.name}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
        {/* TODO: Add mobile nav/drawer for sidebar on small screens */}
      </aside>
      {/* Main content area */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-[#101c36] transition-colors duration-300">
        <div className="w-full h-full">
          {activeView === 'staff' && <StaffListView />}
          {activeView === 'callsign' && <CallsignAssignmentView />}
          {activeView === 'radio' && <RadioSignOut />}
          {activeView === 'shift' && <ShiftRoster />}
          {activeView === 'accreditation' && <Accreditation />}
        </div>
      </main>
    </div>
  );
}

// --- Callsign Assignment View with staff search, unassigned staff, and assignment UI ---
function CallsignAssignmentView() {
  // Default categories
  const defaultCategories = [
    'Management',
    'Internal',
    'External',
    'Venue Operations',
    'Medical',
    'Traffic',
  ];
  type Position = { callsign: string; position: string };
  type Category = { name: string; positions: Position[] };
  const [categories, setCategories] = useState<Category[]>(
    defaultCategories.map((cat) => ({ name: cat, positions: [] }))
  );
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [addingPositionCatIdx, setAddingPositionCatIdx] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<Position>({ callsign: '', position: '' });
  const [editingPosition, setEditingPosition] = useState<{ catIdx: number; posIdx: number } | null>(null);
  // Simulated staff list (placeholder)
  const staffList = [
    { id: 1, name: 'Alice Smith' },
    { id: 2, name: 'Bob Jones' },
    { id: 3, name: 'Charlie Lee' },
    { id: 4, name: 'Dana Patel' },
    { id: 5, name: 'Eve Kim' },
  ];
  // Track assignments: { [categoryIdx][positionIdx]: staffId }
  const [assignments, setAssignments] = useState<{ [key: string]: number | null }>({});
  // Track modal/dropdown state
  const [assigning, setAssigning] = useState<{ catIdx: number; posIdx: number } | null>(null);
  // Search state
  const [search, setSearch] = useState('');

  // Compute unassigned staff
  const assignedIds = Object.values(assignments).filter(Boolean);
  const unassignedStaff = staffList.filter((s) => !assignedIds.includes(s.id));

  // Add category
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { name: newCategory.trim(), positions: [] }]);
      setNewCategory('');
    }
  };
  // Edit category
  const handleEditCategory = (idx: number, name: string) => {
    setCategories(categories.map((cat, i) => (i === idx ? { ...cat, name } : cat)));
  };
  // Delete category
  const handleDeleteCategory = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
  };
  // Add position
  const handleAddPosition = (catIdx: number) => {
    if (newPosition.callsign.trim() && newPosition.position.trim()) {
      setCategories(categories.map((cat, i) =>
        i === catIdx
          ? { ...cat, positions: [...cat.positions, { ...newPosition }] }
          : cat
      ));
      setNewPosition({ callsign: '', position: '' });
      setAddingPositionCatIdx(null);
    }
  };
  // Edit position
  const handleEditPosition = (catIdx: number, posIdx: number, callsign: string, position: string) => {
    setCategories(categories.map((cat, i) =>
      i === catIdx
        ? {
            ...cat,
            positions: cat.positions.map((pos, j) =>
              j === posIdx ? { callsign, position } : pos
            ),
          }
        : cat
    ));
    setEditingPosition(null);
  };
  // Delete position
  const handleDeletePosition = (catIdx: number, posIdx: number) => {
    setCategories(categories.map((cat, i) =>
      i === catIdx
        ? { ...cat, positions: cat.positions.filter((_, j) => j !== posIdx) }
        : cat
    ));
  };

  return (
    <div className="w-full p-2">
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search staff to assign..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* TODO: Add filter buttons if needed */}
      </div>
      {/* Categories and positions grid (as before, but with assignment UI) */}
      <div className="space-y-8">
        {categories.map((cat, catIdx) => (
          <section key={catIdx} className="">
            <div className="mb-2 flex items-center gap-2">
              {editingCategoryIdx === catIdx ? (
                <>
                  <input
                    className="input input-bordered rounded-lg px-2 py-1 text-sm border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100"
                    value={cat.name}
                    onChange={e => handleEditCategory(catIdx, e.target.value)}
                    onBlur={() => setEditingCategoryIdx(null)}
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-200">{cat.name}</h2>
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => setEditingCategoryIdx(catIdx)}>Edit</button>
                  <button className="text-xs text-red-500 hover:underline" onClick={() => handleDeleteCategory(catIdx)}>Delete</button>
                </>
              )}
              <button
                className="ml-4 text-xs bg-blue-100 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-[#23408e] transition"
                onClick={() => setAddingPositionCatIdx(catIdx)}
              >
                + Add Position
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cat.positions.map((pos, posIdx) => {
                const key = `${catIdx}-${posIdx}`;
                const assignedStaff = staffList.find((s) => assignments[key] === s.id);
                return (
                  <div
                    key={posIdx}
                    className={`relative bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-xl shadow-md p-4 flex flex-col gap-2 transition hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500 ${assignedStaff ? 'ring-2 ring-blue-400 dark:ring-blue-300' : ''}`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                      {pos.callsign} <span className="text-gray-500 dark:text-blue-200 text-sm">{pos.position}</span>
                    </div>
                    {/* Assignment UI */}
                    {assignedStaff ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold">
                          {assignedStaff.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <span className="text-gray-900 dark:text-white">{assignedStaff.name}</span>
                        <button
                          className="ml-auto px-2 py-1 rounded bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-[#23408e] transition"
                          onClick={() => setAssignments((a) => ({ ...a, [key]: null }))}
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <button
                        className="mt-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-medium transition"
                        onClick={() => setAssigning({ catIdx, posIdx })}
                      >
                        Assign Staff
                      </button>
                    )}
                    {/* Assignment modal/dropdown (UI only) */}
                    {assigning && assigning.catIdx === catIdx && assigning.posIdx === posIdx && (
                      <div className="absolute z-20 left-0 top-full mt-2 w-full bg-white dark:bg-[#182447] border border-gray-300 dark:border-[#2d437a] rounded-lg shadow-xl p-2">
                        <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Select staff:</div>
                        <div className="max-h-40 overflow-y-auto">
                          {unassignedStaff.length === 0 ? (
                            <div className="text-gray-400 dark:text-gray-400 text-sm">No unassigned staff</div>
                          ) : (
                            unassignedStaff
                              .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
                              .map((s) => (
                                <button
                                  key={s.id}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-[#23408e] text-gray-900 dark:text-gray-100"
                                  onClick={() => {
                                    setAssignments((a) => ({ ...a, [key]: s.id }));
                                    setAssigning(null);
                                  }}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold">
                                      {s.name.split(' ').map((n) => n[0]).join('')}
                                    </span>
                                    {s.name}
                                  </span>
                                </button>
                              ))
                          )}
                        </div>
                        <button
                          className="mt-2 w-full px-3 py-1 rounded bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-[#23408e] transition"
                          onClick={() => setAssigning(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {/* Unassigned staff section (placeholder) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unassigned Staff</h3>
        <div className="flex flex-wrap gap-2">
          {unassignedStaff.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100 font-medium">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold">
                {s.name.split(' ').map((n) => n[0]).join('')}
              </span>
              {s.name}
            </span>
          ))}
        </div>
      </div>
      {/* TODO: Save All button, backend integration, drag & drop, etc. */}
    </div>
  );
}

// --- StaffListView with Supabase integration ---
function StaffListView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [form, setForm] = useState<StaffForm>({
    full_name: '',
    contact_number: '',
    email: '',
    skill_tags: [],
    notes: '',
    active: true,
  });
  // Fetch staff on mount
  useEffect(() => {
    fetchStaff();
  }, []);
  async function fetchStaff() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('staff').select('*').order('full_name');
    if (error) setError(error.message);
    setStaff(data || []);
    setLoading(false);
  }
  function openAddModal() {
    setModalMode('add');
    setForm({ full_name: '', contact_number: '', email: '', skill_tags: [], notes: '', active: true });
    setShowModal(true);
    setCurrentStaff(null);
  }
  function openEditModal(staffMember: any) {
    setModalMode('edit');
    setForm({
      full_name: staffMember.full_name || '',
      contact_number: staffMember.contact_number || '',
      email: staffMember.email || '',
      skill_tags: staffMember.skill_tags || [],
      notes: staffMember.notes || '',
      active: staffMember.active ?? true,
    });
    setCurrentStaff(staffMember);
    setShowModal(true);
  }
  async function handleSave() {
    const payload = {
      ...form,
      skill_tags: form.skill_tags,
    };
    if (modalMode === 'add') {
      const { error } = await supabase.from('staff').insert([payload]);
      if (error) setError(error.message);
    } else if (modalMode === 'edit' && currentStaff) {
      const { error } = await supabase.from('staff').update(payload).eq('id', currentStaff.id);
      if (error) setError(error.message);
    }
    setShowModal(false);
    fetchStaff();
  }
  async function handleDelete(staffId: string) {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    const { error } = await supabase.from('staff').delete().eq('id', staffId);
    if (error) setError(error.message);
    fetchStaff();
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101c36] p-8 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors">
          <PlusIcon className="h-5 w-5" /> Add Staff
        </button>
      </div>
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-300 py-8">Loading staff...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : staff.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-300 py-8">No staff found.</div>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Name</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Contact</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Email</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Skills</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Notes</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Active</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-[#2d437a]">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.full_name}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.contact_number}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.email}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{(s.skill_tags || []).join(', ')}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.notes}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEditModal(s)} className="text-blue-600 dark:text-blue-300 hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal for Add/Edit Staff */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{modalMode === 'add' ? 'Add Staff' : 'Edit Staff'}</h2>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Full Name</label>
                <input type="text" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Contact Number</label>
                <input type="text" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Email</label>
                <input type="email" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Skills</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded bg-gray-50 dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a]">
                  {SKILL_OPTIONS.map(skill => (
                    <label key={skill} className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={form.skill_tags.includes(skill)}
                        onChange={e => {
                          setForm(f => ({
                            ...f,
                            skill_tags: e.target.checked
                              ? [...f.skill_tags, skill]
                              : f.skill_tags.filter(s => s !== skill)
                          }));
                        }}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Notes</label>
                <textarea className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                <label htmlFor="active" className="text-gray-700 dark:text-blue-200">Active</label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold">{modalMode === 'add' ? 'Add' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 