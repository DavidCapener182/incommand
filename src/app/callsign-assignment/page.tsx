"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UserGroupIcon, KeyIcon, DevicePhoneMobileIcon, CalendarDaysIcon, IdentificationIcon, PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, ChevronDownIcon, Squares2X2Icon, CheckCircleIcon, ExclamationTriangleIcon, UsersIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
const RadioSignOut = dynamic(() => import('../radio-sign-out/page'), { ssr: false });

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
const ShiftRoster = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Shift Roster view coming soon...</div>
);
const Accreditation = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Accreditation view coming soon...</div>
);

const navItems = [
  { name: 'Staff Management', icon: UserGroupIcon, key: 'staff' },
  { name: 'Callsign Assignment', icon: KeyIcon, key: 'callsign' },
  { name: 'Radio Sign Out', icon: DevicePhoneMobileIcon, key: 'radio' },
];

// Move SKILL_OPTIONS to the top of the file
const SKILL_OPTIONS: string[] = [
  "Head of Security (HOS)",
  "Deputy Head of Security",
  "Security Manager",
  "Supervisor",
  "SIA Security Officer",
  "(SIA)",
  "Steward",
  "Control Room Operator",
  "Event Control Manager",
  "Radio Controller",
  "Welfare Team",
  "Medic / Paramedic",
  "Traffic Marshal",
  "Traffic Management",
  "Venue Manager",
  "Duty Manager",
  "Site Manager",
  "Access Control",
  "Accreditation",
  "Production Manager",
  "Stage Manager",
  "Artist Liaison",
  "Front of House",
  "Fire Steward",
  "Health & Safety",
  "Dog Handler (K9)",
  "CCTV Operator",
  "Logistics Coordinator",
];

// Add StaffForm type near the top
type StaffForm = {
  id?: string;
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

  // Load positions and assignments from Supabase when eventId changes
  useEffect(() => {
    if (!eventId) return;
    const loadRolesAndAssignments = async () => {
      setSaveStatus("Loading saved callsigns...");
      // Load positions
      const { data: roles, error: rolesError } = await supabase
        .from("callsign_positions")
        .select("id, area, short_code, callsign, position, required")
        .eq("event_id", eventId);
      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("callsign_assignments")
        .select("position_id, user_id, assigned_name")
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
            required: r.required,
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
        // Map assignments by position_id
        const assignMap: Record<string, string> = {};
        assignmentsData.forEach((a) => {
          if (a.user_id) {
            // store the id string for assignedStaff usage elsewhere
            // we keep assigned_name for legacy fallbacks
            assignMap[a.position_id] = a.assigned_name || "";
          } else if (a.assigned_name) {
            assignMap[a.position_id] = a.assigned_name;
          }
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

  // Fetch previous unique names for each position_id (excluding current event)
  useEffect(() => {
    if (!eventId) return;
    const fetchPreviousNames = async () => {
      // Get all previous assignments for all roles, excluding current event
      const { data, error } = await supabase
        .from("callsign_assignments")
        .select("position_id, assigned_name, assigned_at")
        .neq("event_id", eventId)
        .order("assigned_at", { ascending: false });
      if (error) return;
      // Map: position_id -> unique names (most recent first)
      const map: Record<string, string[]> = {};
      data?.forEach((row) => {
        if (!row.assigned_name) return;
        if (!map[row.position_id]) map[row.position_id] = [];
        if (!map[row.position_id].includes(row.assigned_name)) {
          map[row.position_id].push(row.assigned_name);
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
      // Deduplicate roles by event_id, area, short_code
      const uniqueRolesMap = new Map();
      roles.forEach(role => {
        const key = `${role.event_id}|${role.area}|${role.short_code}`;
        if (!uniqueRolesMap.has(key)) {
          uniqueRolesMap.set(key, role);
        }
      });
      const uniqueRoles = Array.from(uniqueRolesMap.values());

      // Upsert roles with correct conflict target
      const { data: upsertedRoles, error: rolesError } = await supabase
        .from("callsign_positions")
        .upsert(uniqueRoles, { onConflict: "event_id,area,short_code" })
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      {/* Sidebar - restored */}
      <aside className="hidden md:flex w-64 flex-none bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex-col shadow-lg z-10">
        {/* Top bar with section title */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Staffing Centre</span>
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
      </aside>
      {/* Main content area */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
        <div className="w-full h-full">
          {activeView === 'staff' && <StaffListView />}
          {activeView === 'callsign' && <CallsignAssignmentView eventId={eventId} />}
          {activeView === 'radio' && <RadioSignOut />}
        </div>
      </main>
    </div>
  );
}

// --- Callsign Assignment View with staff search, unassigned staff, and assignment UI ---
function CallsignAssignmentView({ eventId }: { eventId: string | null }) {
  // Default categories with better structure - matching database areas
  const defaultCategories = [
    { id: 1, name: 'Management', color: 'bg-gradient-to-r from-purple-500 to-purple-600', positions: [] },
    { id: 2, name: 'Internal', color: 'bg-gradient-to-r from-blue-500 to-blue-600', positions: [] },
    { id: 3, name: 'External', color: 'bg-gradient-to-r from-green-500 to-green-600', positions: [] },
    { id: 4, name: 'Venue Operations', color: 'bg-gradient-to-r from-orange-500 to-orange-600', positions: [] },
    { id: 5, name: 'Medical', color: 'bg-gradient-to-r from-red-500 to-red-600', positions: [] },
    { id: 6, name: 'Traffic Management', color: 'bg-gradient-to-r from-slate-500 to-slate-600', positions: [] },
  ];

  type Position = { 
    id: string;
    callsign: string; 
    position: string;
    short?: string;
    assignedStaff?: string; // changed to string for uuid
    assignedName?: string; // fallback if not linked to staff
    required?: boolean;
    skills?: string[];
  };
  
  type Category = { 
    id: number;
    name: string; 
    color: string;
    positions: Position[] 
  };

  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{categoryId: number, positionId: string} | null>(null);
  // In CallsignAssignmentView, add state for assignedNames
  const [assignedNames, setAssignedNames] = useState<string[]>([]);

  // Real staff data from Supabase
  const [staffList, setStaffList] = useState<any[]>([]);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // --- NEW: Load roles and assignments from Supabase ---
  useEffect(() => {
    const fetchRolesAndAssignments = async () => {
      if (!eventId || !userCompanyId) return;
      // 1. Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('callsign_positions')
        .select('id, area, short_code, callsign, position, required')
        .eq('event_id', eventId);
      if (rolesError) return;
      // 2. Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('callsign_assignments')
        .select('position_id, user_id, assigned_name')
        .eq('event_id', eventId);
      if (assignmentsError) return;
      // 3. Map roles to categories
      const areaMap: Record<string, Position[]> = {};
      const assignedNamesArr: string[] = [];
      roles?.forEach((role) => {
        if (!areaMap[role.area]) areaMap[role.area] = [];
        // Find assignment for this role
        const assignment = assignments?.find(a => a.position_id === role.id);
        if (assignment?.assigned_name) assignedNamesArr.push(assignment.assigned_name);
        areaMap[role.area].push({
          id: role.id,
          callsign: role.callsign,
          short: role.short_code,
          position: role.position,
          required: role.required,
          assignedStaff: (assignment?.user_id as string) || undefined,
          assignedName: assignment?.assigned_name || undefined,
        });
      });
      // 4. Map to defaultCategories structure
      const newCategories = defaultCategories.map(cat => {
        const positions = areaMap[cat.name] || [];
        return { ...cat, positions };
      });
      setCategories(newCategories);
      setAssignedNames(assignedNamesArr);
    };
    fetchRolesAndAssignments();
    // Only run when eventId or userCompanyId changes
  }, [eventId, userCompanyId]);

  // Load staff data from Supabase
  useEffect(() => {
    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (userCompanyId) {
      fetchStaff();
    }
  }, [userCompanyId]);

  async function fetchUserCompany() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.company_id) {
        setUserCompanyId(profile.company_id);
      } else {
        console.log("No company ID available, skipping staff fetch");
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  }

  async function fetchStaff() {
    if (!userCompanyId) {
      console.log("No company ID available, skipping staff fetch");
      return;
    }
    
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, contact_number, email, skill_tags, notes, active')
        .eq('company_id', userCompanyId)
        .order('full_name');
      
      if (error) throw error;

      const formattedStaff = data?.map(staff => ({
        id: staff.id,
        full_name: staff.full_name,
        contact_number: staff.contact_number,
        email: staff.email,
        skill_tags: staff.skill_tags || [],
        notes: staff.notes,
        active: staff.active,
      })) || [];

      setStaffList(formattedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoadingStaff(false);
    }
  }

  // Get assigned staff IDs (now includes assignedName for count)
  const assignedCount = categories.flatMap(cat =>
    cat.positions.filter(pos => pos.assignedStaff || pos.assignedName)
  ).length;

  const assignedStaffIds = categories.flatMap(cat =>
    cat.positions.map(pos => pos.assignedStaff).filter(Boolean)
  );

  // Filter staffList to only include staff not assigned to any position (by id or by name)
  const unassignedStaff = staffList.filter(
    staff => !assignedStaffIds.includes(staff.id) && !assignedNames.includes(staff.full_name)
  );

  // Filter positions based on global search
  const filteredCategories = categories.map(category => ({
    ...category,
    positions: category.positions.filter(position => 
      position.callsign.toLowerCase().includes(globalSearch.toLowerCase()) ||
      position.position.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (position.assignedStaff && staffList.find(s => s.id === position.assignedStaff)?.full_name.toLowerCase().includes(globalSearch.toLowerCase()))
    )
  })).filter(category => 
    category.positions.length > 0 || globalSearch === ''
  );

  // Assign staff to position
  const assignStaff = (categoryId: number, positionId: string, staffId: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      positions: cat.positions.map(pos => {
        // Remove staff from any other position
        if (pos.assignedStaff === staffId) {
          return { ...pos, assignedStaff: undefined };
        }
        // Assign staff to the selected position
        if (cat.id === categoryId && pos.id === positionId) {
          return { ...pos, assignedStaff: staffId };
        }
        return pos;
      })
    })));
    setPendingChanges(true);
  };

  // Unassign staff from position
  const unassignStaff = (categoryId: number, positionId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            positions: cat.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, assignedStaff: undefined }
                : pos
            )
          }
        : cat
    ));
    setPendingChanges(true);
  };

  // Add new position
  const addPosition = (categoryId: number, position: Omit<Position, 'id'>) => {
    const newPosition = {
      ...position,
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, positions: [...cat.positions, newPosition] }
        : cat
    ));
    setPendingChanges(true);
  };

  // Add new category
  const addCategory = (name: string, color: string) => {
    const newId = Math.max(...categories.map(c => c.id)) + 1;
    const newCategory = {
      id: newId,
      name,
      color,
      positions: []
    };
    setCategories(prev => [...prev, newCategory]);
    setPendingChanges(true);
  };

  // Edit category
  const editCategory = (categoryId: number, name: string, color: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, name, color }
        : cat
    ));
    setPendingChanges(true);
  };

  // Delete category
  const deleteCategory = (categoryId: number) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setPendingChanges(true);
  };

  // Helper to check if a string is a valid UUID
  function isValidUUID(str: string | undefined): boolean {
    return !!str && validateUUID(str);
  }

  // Save all changes
  const saveChanges = async () => {
    if (!eventId) {
      alert("No current event selected.");
      return;
    }
    setPendingChanges(false);
    try {
      // Fetch existing roles for this event
      const { data: existingRoles, error: fetchError } = await supabase
        .from('callsign_positions')
        .select('id, area, short_code')
        .eq('event_id', eventId);
      if (fetchError) throw fetchError;
      const roleIdMap = new Map();
      (existingRoles || []).forEach(role => {
        roleIdMap.set(`${role.area}|${role.short_code}`, role.id);
      });

      // Fetch all valid user ids from profiles
      const { data: validUsers, error: userError } = await supabase
        .from('profiles')
        .select('id');
      if (userError) throw userError;
      const validUserIds = new Set((validUsers || []).map(u => u.id));

      // 1. Upsert all positions (callsign_roles)
      const roles = categories.flatMap(category =>
        category.positions.map(pos => {
          const key = `${category.name}|${pos.short || pos.callsign}`;
          return {
            id: roleIdMap.get(key) || uuidv4(),
            event_id: eventId,
            area: category.name,
            short_code: pos.short || pos.callsign,
            callsign: pos.callsign,
            position: pos.position,
            required: pos.required ?? false,
          };
        })
      );
      // Deduplicate roles by event_id, area, short_code
      const uniqueRolesMap = new Map();
      roles.forEach(role => {
        const key = `${role.event_id}|${role.area}|${role.short_code}`;
        if (!uniqueRolesMap.has(key)) {
          uniqueRolesMap.set(key, role);
        }
      });
      const uniqueRoles = Array.from(uniqueRolesMap.values());

      // Upsert roles with correct conflict target
      const { error: rolesError } = await supabase.from('callsign_positions').upsert(uniqueRoles, { onConflict: 'event_id,area,short_code' });
      if (rolesError) throw rolesError;
      const idMap: Record<string, string> = {};
      uniqueRoles.forEach(role => {
        idMap[role.id] = role.id;
      });
      // 2. Upsert all assignments (callsign_assignments)
      const assignmentsArr = categories.flatMap(category =>
        category.positions.map(pos => {
          let user_id = null;
          let assigned_name = pos.assignedName || null;
          if (pos.assignedStaff && validUserIds.has(pos.assignedStaff)) {
            user_id = pos.assignedStaff;
            // Optionally, you could also set assigned_name to the staff name if you want
          } else if (pos.assignedStaff) {
            // If assignedStaff is set but not a valid user, fallback to assigned_name
            user_id = null;
            assigned_name = staffList.find(s => s.id === pos.assignedStaff)?.full_name || null;
          }
          return {
            event_id: eventId,
            position_id: (uniqueRoles.find(r => r.area === category.name && r.short_code === (pos.short || pos.callsign)) || {}).id,
            user_id,
            assigned_name,
          };
        })
      );
      if (assignmentsArr.length > 0) {
        const { error: assignError } = await supabase
          .from("callsign_assignments")
          .upsert(assignmentsArr, { onConflict: "event_id,position_id" });
        if (assignError) throw assignError;
      }
      alert("Assignments and roles saved successfully.");
    } catch (err: any) {
      alert("Error saving: " + (err.message || err));
    }
  };

  // Add deletePosition function
  const handleDeletePosition = (categoryId: number, positionId: string) => {
    setDeleteConfirm({ categoryId, positionId });
  };
  const confirmDeletePosition = async () => {
    if (!deleteConfirm) return;
    const { categoryId, positionId } = deleteConfirm;
    setDeleteConfirm(null);
    // Remove from UI
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, positions: cat.positions.filter(pos => pos.id !== positionId) }
        : cat
    ));
    // Remove from DB
    try {
      await supabase.from('callsign_assignments').delete().eq('position_id', positionId);
      await supabase.from('callsign_positions').delete().eq('id', positionId);
    } catch (err) {
      const e = err as any;
      alert('Error deleting position: ' + (e.message || e));
    }
  };
  const cancelDeletePosition = () => setDeleteConfirm(null);

  // In CallsignAssignmentView, filter available staff by assignment and assigned name
  const getMatchingStaff = (position: { skills?: string[] }) => {
    // Only staff not assigned to any position and not in assignedNames
    const assignedStaffIds = categories.flatMap(cat =>
      cat.positions.map(pos => pos.assignedStaff).filter(Boolean)
    );
    return staffList.filter((staff: { id: string; skill_tags: string[]; full_name: string }) => {
      if (assignedStaffIds.includes(staff.id)) return false;
      if (assignedNames.includes(staff.full_name)) return false;
      if (position.skills && position.skills.length > 0) {
        return (staff.skill_tags || []).some((skill: string) =>
          position.skills!.some((reqSkill: string) =>
            skill.trim().toLowerCase() === reqSkill.trim().toLowerCase()
          )
        );
      }
      return true;
    });
  };

  if (loadingStaff) {
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#101c36] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading staff data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#101c36] dark:to-[#1a2a57] transition-colors duration-300">
      {/* Enhanced Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#23408e]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#2d437a] shadow-lg">
      <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Squares2X2Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Callsign Assignment</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Assign your team to positions for the current event</p>
              </div>
            </div>
            
            {/* Enhanced Search Bar */}
            <div className="flex items-center gap-4 flex-1 lg:flex-none lg:w-96">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by callsign, role, or staff name..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddPositionModal(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow">
                <PlusIcon className="w-5 h-5" />
                Position
              </button>
              <button onClick={() => setShowAddCategoryModal(true)} className="inline-flex items-center gap-2 bg-white dark:bg-[#23408e] text-gray-700 dark:text-white border border-gray-200 dark:border-[#2d437a] py-2.5 px-4 rounded-lg shadow-sm hover:shadow">
                <PlusIcon className="w-5 h-5" />
                Department
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Enhanced Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Positions',
              value: categories.reduce((sum, c) => sum + c.positions.length, 0),
              color: 'text-gray-900 dark:text-white',
              icon: <Squares2X2Icon className="w-6 h-6 text-blue-600" />,
            },
            {
              label: 'Assigned',
              value: assignedCount,
              color: 'text-green-600 dark:text-green-400',
              icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
            },
            {
              label: 'Vacant',
              value: categories.reduce((sum, c) => sum + c.positions.length, 0) - assignedCount,
              color: 'text-amber-600 dark:text-amber-400',
              icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />,
            },
            {
              label: 'Available Staff',
              value: unassignedStaff.length,
              color: 'text-blue-600 dark:text-blue-400',
              icon: <UsersIcon className="w-6 h-6 text-blue-600" />,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-300">{kpi.label}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-[#182447] flex items-center justify-center">
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available Staff Section */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Staff</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">Assign staff to open positions</p>
            </div>
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm px-3 py-1.5 rounded-full font-medium">
              {unassignedStaff.length} available
            </span>
          </div>
          
          {unassignedStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">🎉</div>
              <div className="font-medium text-lg mb-2">All staff assigned</div>
              <div className="text-sm">Great job! All available staff have been assigned to positions.</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unassignedStaff.map(staff => (
                <div key={staff.id} className="bg-gray-50 dark:bg-[#182447] px-3 py-1.5 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2d437a] cursor-default select-none">
                  {staff.full_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Department Cards */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm overflow-hidden">
              {/* Department Header - neutral, compact */}
              <div className="px-4 sm:px-6 py-3 bg-white dark:bg-[#23408e] border-b border-gray-200 dark:border-[#2d437a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                    <div className="hidden sm:flex gap-2">
                      <span className="bg-gray-100 dark:bg-[#182447] text-gray-700 dark:text-gray-200 text-xs px-2.5 py-1 rounded-full font-medium">
                        {category.positions.length} positions
                      </span>
                      <span className="bg-gray-100 dark:bg-[#182447] text-gray-700 dark:text-gray-200 text-xs px-2.5 py-1 rounded-full font-medium">
                        {category.positions.filter(p => p.assignedStaff || p.assignedName).length} assigned
                      </span>
                      {category.positions.some(p => !p.assignedStaff && !p.assignedName) && (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                          {category.positions.filter(p => !p.assignedStaff && !p.assignedName).length} vacant
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowEditCategoryModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-blue-900/20"
                      title="Edit Department"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowAddPositionModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-blue-900/20"
                      title="Add Position"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Positions Grid */}
              <div className="p-6">
                {category.positions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="text-lg font-medium mb-2">No positions yet</div>
                    <div className="text-sm">Click the + button above to add positions to this department</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {category.positions.map((position) => {
                      const assignedStaff = position.assignedStaff 
                        ? staffList.find(s => s.id === position.assignedStaff)
                        : null;
                      const isAssigned = !!assignedStaff || !!position.assignedName;

                      return (
                        <PositionCard
                          key={position.id}
                          position={position}
                          assignedStaff={assignedStaff}
                          assignedName={position.assignedName}
                          isAssigned={isAssigned}
                          category={category}
                          unassignedStaff={unassignedStaff}
                          onAssign={(staffId) => assignStaff(category.id, position.id, staffId)}
                          onUnassign={() => unassignStaff(category.id, position.id)}
                          onEdit={() => setEditingPosition(position)}
                          onDelete={() => handleDeletePosition(category.id, position.id)}
                          getMatchingStaff={getMatchingStaff}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Fixed Save Bar */}
      {pendingChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <button
              onClick={saveChanges}
              className="bg-white text-blue-600 px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPositionModal
        isOpen={showAddPositionModal}
        onClose={() => {
          setShowAddPositionModal(false);
          setSelectedCategory(null);
        }}
        categories={categories}
        selectedCategory={selectedCategory}
        onAdd={addPosition}
      />

      <EditPositionModal
        isOpen={!!editingPosition}
        position={editingPosition}
        onClose={() => setEditingPosition(null)}
        onSave={(updatedPosition) => {
          // Update the correct position in categories
          setCategories(prev => prev.map(cat => ({
            ...cat,
            positions: cat.positions.map(pos =>
              pos.id === updatedPosition.id
                ? { ...pos, ...updatedPosition }
                : pos
            )
          })));
          setEditingPosition(null);
          setPendingChanges(true);
        }}
      />

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onAdd={addCategory}
      />

      <EditCategoryModal
        isOpen={showEditCategoryModal}
        category={editingCategory}
        onClose={() => {
          setShowEditCategoryModal(false);
          setEditingCategory(null);
        }}
        onEdit={editCategory}
        onDelete={deleteCategory}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2d437a] p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Position</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-200">Are you sure you want to delete this position? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelDeletePosition} className="px-6 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all duration-200">Cancel</button>
              <button onClick={confirmDeletePosition} className="px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-200">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Position Card Component
function PositionCard({ 
  position, 
  assignedStaff, 
  assignedName,
  isAssigned,
  category, 
  unassignedStaff, 
  onAssign, 
  onUnassign, 
  onEdit, 
  onDelete,
  getMatchingStaff
}: {
  position: any;
  assignedStaff: any;
  assignedName?: string;
  isAssigned: boolean;
  category: any;
  unassignedStaff: any[];
  onAssign: (staffId: string) => void;
  onUnassign: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getMatchingStaff: (position: any) => any[];
}) {
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number} | null>(null);
  const assignBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAssignMenu) {
        const target = event.target as Element;
        if (!target.closest('.assign-dropdown-container') && !target.closest('.assign-btn')) {
          setShowAssignMenu(false);
        }
      }
    };
    if (showAssignMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssignMenu]);

  useEffect(() => {
    if (showAssignMenu && assignBtnRef.current) {
      const rect = assignBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [showAssignMenu]);

  const isVacant = !assignedStaff && !assignedName;

  const matchingStaff = getMatchingStaff(position);

  return (
    <div className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
      isAssigned 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
        : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700 hover:border-blue-300 dark:hover:border-blue-500'
    } ${isAssigned ? 'shadow-lg' : 'hover:shadow-xl'}`}>
      {/* Enhanced Status Indicator */}
      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
        isAssigned ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
      }`}>
        {isAssigned ? '✓' : '!'}
      </div>
      
      {/* Enhanced Edit/Delete Buttons */}
      <div className="absolute top-2 right-10 flex gap-1 z-10">
        <button 
          onClick={onEdit} 
          title="Edit position" 
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
          </svg>
        </button>
        <button 
          onClick={onDelete} 
          title="Delete position" 
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        {/* Enhanced Role Badge Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-block bg-white/90 dark:bg-[#23408e]/90 border-2 border-gray-200 dark:border-[#2d437a] rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white shadow-sm">
            {position.callsign}
          </span>
          <span className="inline-block bg-gray-100 dark:bg-[#182447] border-2 border-gray-200 dark:border-[#2d437a] rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
            {position.position}
          </span>
        </div>
        
        {/* Enhanced Assigned Staff or Name with Photo/Initials */}
        {isAssigned && (
          <div className="flex items-center gap-3 mt-2">
            {assignedStaff && assignedStaff.photoUrl ? (
              <img src={assignedStaff.photoUrl} alt={assignedStaff.full_name} className="h-10 w-10 rounded-full object-cover border-2 border-gray-300 shadow-md" />
            ) : assignedStaff ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(assignedStaff.full_name || '').split(' ').map((n: string) => n[0]).join('')}
              </div>
            ) : assignedName ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(assignedName || '').split(' ').map((n: string) => n[0]).join('')}
              </div>
            ) : null}
            <span className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800 text-green-800 dark:text-green-200 text-sm px-3 py-1.5 rounded-xl font-medium shadow-sm">
              {assignedStaff ? assignedStaff.full_name : assignedName}
            </span>
          </div>
        )}
        
        {/* Enhanced Vacant State */}
        {isVacant && (
          <div className="mt-3 flex flex-col items-center gap-3">
            <span className="inline-block text-sm text-gray-500 dark:text-gray-400 font-medium">No one assigned</span>
            <button
              ref={assignBtnRef}
              className="text-blue-600 text-sm font-medium hover:text-blue-800 bg-transparent p-0 border-0 assign-btn hover:underline transition-all duration-200"
              onClick={() => setShowAssignMenu(v => !v)}
              type="button"
              style={{ minWidth: 0 }}
            >
              Assign Staff
            </button>
            {showAssignMenu && dropdownPos && createPortal(
              <div 
                className="assign-dropdown-container" 
                style={{
                  position: 'fixed', 
                  top: dropdownPos.top, 
                  left: dropdownPos.left, 
                  zIndex: 9999, 
                  background: 'white', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: 12, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
                  width: 220, 
                  padding: 12,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-3 font-medium">Select staff to assign:</div>
                {matchingStaff.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No available staff</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {matchingStaff.map(staff => (
                      <button
                        key={staff.id}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200"
                        onClick={() => { onAssign(staff.id); setShowAssignMenu(false); }}
                      >
                        {staff.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Position Modal Component
function AddPositionModal({ isOpen, onClose, categories, selectedCategory, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  selectedCategory: number | null;
  onAdd: (categoryId: number, position: any) => void;
}) {
  // AddPositionModal formData type
  type AddPositionFormData = {
    callsign: string;
    position: string;
    categoryId: number;
    required: boolean;
    skills: string[];
  };

  const [formData, setFormData] = useState<AddPositionFormData>({
    callsign: '',
    position: '',
    categoryId: selectedCategory || categories[0]?.id || 1,
    required: false,
    skills: []
  });

  useEffect(() => {
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategory }));
    }
  }, [selectedCategory]);

  // In AddPositionModal, add an Amount field and callsign suggestion logic
  const [amount, setAmount] = useState(1);

  // Suggest next available callsign based on department and last used
  useEffect(() => {
    if (!categories || !formData.categoryId) return;
    const cat = categories.find(c => c.id === formData.categoryId);
    if (!cat) return;
    // Find last used callsign in this category
    const lastCallsign = cat.positions.length > 0 ? cat.positions[cat.positions.length - 1].callsign : '';
    // Extract prefix and number
    const match = lastCallsign.match(/([A-Za-z]+)(\d+)/);
    let prefix = cat.name.split(' ')[0].toUpperCase().charAt(0);
    let nextNum = 1;
    if (match) {
      prefix = match[1];
      nextNum = parseInt(match[2], 10) + 1;
    }
    // Only auto-suggest if callsign is empty
    if (!formData.callsign) {
      setFormData(prev => ({ ...prev, callsign: `${prefix}${nextNum}` }));
    }
  }, [formData.categoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.callsign.trim() && formData.position.trim()) {
      // Bulk creation logic
      const cat = categories.find(c => c.id === formData.categoryId);
      let baseCallsign = formData.callsign.trim();
      let prefix = baseCallsign.replace(/\d+$/, '');
      let startNum = parseInt(baseCallsign.match(/\d+$/)?.[0] || '1', 10);
      const positions = Array.from({ length: amount }, (_, i) => ({
        callsign: `${prefix}${startNum + i}`,
        position: formData.position.trim(),
        required: formData.required,
        skills: formData.skills
      }));
      positions.forEach(pos => onAdd(formData.categoryId, pos));
      setFormData({ callsign: '', position: '', categoryId: categories[0]?.id || 1, required: false, skills: [] });
      setAmount(1);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2d437a] w-full max-w-xl mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Add New Position</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-gray-50 dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Callsign
            </label>
            <input
              type="text"
              value={formData.callsign}
              onChange={(e) => setFormData(prev => ({ ...prev, callsign: e.target.value }))}
              placeholder="e.g., ALPHA-1, BRAVO-2"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Position/Role
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="e.g., Door Supervisor, Control Room Operator"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
      </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.required}
              onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="required" className="text-sm text-gray-700 dark:text-gray-200">
              Critical position (must be filled)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Required Skills
            </label>
            <select
              multiple
              value={formData.skills}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(opt => opt.value as string);
                setFormData(prev => ({ ...prev, skills: options }));
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {SKILL_OPTIONS.map((skill: string) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Amount
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={amount}
              onChange={e => setAmount(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Footer */}
          <div className="px-0 pt-2 pb-1 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow">Add Position</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Position Modal Component (placeholder)
function EditPositionModal({ isOpen, position, onClose, onSave }: {
  isOpen: boolean;
  position: any;
  onClose: () => void;
  onSave: (position: any) => void;
}) {
  const [formData, setFormData] = useState(position || {});
  useEffect(() => {
    setFormData(position || {});
  }, [position]);
  if (!isOpen || !position) return null;
  const handleUnassign = () => {
    setFormData({ ...formData, assignedStaff: undefined, assignedName: undefined });
  };
  const assignedPerson = formData.assignedStaff
    ? formData.assignedName || ''
    : formData.assignedName || '';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Position</h2>
        <div className="mb-4 p-3 rounded bg-gray-50 dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a]">
          <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{formData.callsign || position.callsign}</div>
          <input
            type="text"
            className="w-full text-xs font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 mb-1"
            value={formData.position || ''}
            onChange={e => setFormData({ ...formData, position: e.target.value })}
            placeholder="Role/Position (e.g., Pit Supervisor, Gate Supervisor)"
          />
          {(formData.assignedStaff || formData.assignedName) && (
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">Assigned to: {assignedPerson}</div>
          )}
        </div>
        {(formData.assignedStaff || formData.assignedName) && (
          <>
            <div className="mb-2 text-xs text-gray-700 dark:text-gray-200">This will remove the current assignment from this position.</div>
            <button
              onClick={handleUnassign}
              className="mb-4 px-4 py-2 rounded border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              Unassign
            </button>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// --- StaffListView with Supabase integration ---
function StaffListView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffForm>({
    full_name: "",
    contact_number: "",
    email: "",
    skill_tags: [],
    notes: "",
    active: true,
  });
  const [staff, setStaff] = useState<any[]>([]);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  useEffect(() => {
    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (userCompanyId) {
      fetchStaff();
    }
  }, [userCompanyId]);

  async function fetchUserCompany() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.company_id) {
        setUserCompanyId(profile.company_id);
      } else {
        console.log("No company ID available, skipping staff fetch");
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  }

  async function fetchStaff() {
    if (!userCompanyId) {
      console.log("No company ID available, skipping staff fetch");
      return;
    }
    
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, contact_number, email, skill_tags, notes, active')
        .eq('company_id', userCompanyId)
        .order('full_name');
      
      if (error) throw error;

      const formattedStaff = data?.map(staff => ({
        id: staff.id,
        full_name: staff.full_name,
        contact_number: staff.contact_number,
        email: staff.email,
        skill_tags: staff.skill_tags || [],
        notes: staff.notes,
        active: staff.active,
      })) || [];

      setStaff(formattedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoadingStaff(false);
    }
  }

  function openAddModal() {
    setCurrentStaff({
      full_name: "",
      contact_number: "",
      email: "",
      skill_tags: [],
      notes: "",
      active: true,
    });
    setIsAddModalOpen(true);
  }

  function openEditModal(staffMember: any) {
    setCurrentStaff({
      ...staffMember,
      skill_tags: staffMember.skill_tags || [],
    });
    setIsEditModalOpen(true);
  }

  async function handleSave() {
    if (!userCompanyId) {
      alert("No company found. Please contact support.");
      return;
    }

    try {
      if (currentStaff.id) {
        // Update existing staff
        const { error } = await supabase
          .from("staff")
          .update({
            full_name: currentStaff.full_name,
            contact_number: currentStaff.contact_number,
            email: currentStaff.email,
            skill_tags: currentStaff.skill_tags,
            notes: currentStaff.notes,
            active: currentStaff.active,
          })
          .eq("id", currentStaff.id);

        if (error) throw error;
      } else {
        // Create new staff
        const { error } = await supabase
          .from("staff")
          .insert({
            full_name: currentStaff.full_name,
            contact_number: currentStaff.contact_number,
            email: currentStaff.email,
            skill_tags: currentStaff.skill_tags,
            notes: currentStaff.notes,
            active: currentStaff.active,
            company_id: userCompanyId,
          });

        if (error) throw error;
      }

    fetchStaff();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Error saving staff. Please try again.");
  }
  }

  async function handleDelete(staffId: string) {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", staffId);

      if (error) throw error;
    fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Error deleting staff. Please try again.");
  }
  }

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Use a static list of all possible skills for the filter dropdown
  const ALL_SKILLS = [
    "Head of Security (HOS)",
    "Deputy Head of Security",
    "Security Manager",
    "Supervisor",
    "SIA Security Officer",
    "(SIA)",
    "Steward",
    "Control Room Operator",
    "Event Control Manager",
    "Radio Controller",
    "Welfare Team",
    "Medic / Paramedic",
    "Traffic Marshal",
    "Traffic Management",
    "Venue Manager",
    "Duty Manager",
    "Site Manager",
    "Access Control",
    "Accreditation",
    "Production Manager",
    "Stage Manager",
    "Artist Liaison",
    "Front of House",
    "Fire Steward",
    "Health & Safety",
    "Dog Handler (K9)",
    "CCTV Operator",
    "Logistics Coordinator"
  ];
  const allSkills = ALL_SKILLS;

  // Filtered staff based on search and filters
  const filteredStaff = staff.filter(member => {
    const matchesName = member.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkill ? (member.skill_tags || []).includes(selectedSkill) : true;
    const matchesStatus = selectedStatus === '' ? true : selectedStatus === 'active' ? !!member.active : !member.active;
    return matchesName && matchesSkill && matchesStatus;
  });

  const openProfileModal = (member: any) => {
    setSelectedProfile(member);
    setProfileModalOpen(true);
  };
  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedProfile(null);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Staff Management</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage your team members and their details</p>
          </div>
          <button
            onClick={openAddModal}
            className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-gray-50 dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {/* Skill filter */}
            <select
              value={selectedSkill}
              onChange={e => setSelectedSkill(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-gray-50 dark:bg-[#182447] text-gray-900 dark:text-gray-100 py-2 px-3"
            >
              <option value="">All Skills</option>
              {allSkills.map((skill: string) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
            {/* Status filter + action */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="inline-flex rounded-lg border border-gray-300 dark:border-[#2d437a] overflow-hidden">
                {[
                  { id: '', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedStatus(opt.id)}
                    className={`px-3 py-2 text-sm font-medium ${selectedStatus === opt.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#182447] text-gray-700 dark:text-gray-100'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={openAddModal}
                className="sm:hidden inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Add
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-blue-100">Showing {filteredStaff.length} of {staff.length}</div>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No staff found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Try adjusting your search or filters.</p>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Staff
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#2d437a] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2d437a]">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#2d437a] cursor-pointer" onClick={() => openProfileModal(member)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner">
                          <span className="text-white font-semibold text-sm">
                            {(member.full_name || '').split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {member.full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {member.contact_number ? (
                        <a href={`tel:${member.contact_number}`} className="text-blue-600 dark:text-blue-300 hover:underline">{member.contact_number}</a>
                      ) : (
                        'Not provided'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(member.skill_tags || []).map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-800/60 dark:text-blue-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {isAddModalOpen ? 'Add New Staff Member' : 'Edit Staff Member'}
            </h2>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Full Name</label>
                <input type="text" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={currentStaff.full_name} onChange={e => setCurrentStaff(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Contact Number</label>
                <input type="text" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={currentStaff.contact_number} onChange={e => setCurrentStaff(f => ({ ...f, contact_number: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Email</label>
                <input type="email" className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={currentStaff.email} onChange={e => setCurrentStaff(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-blue-200 mb-1">Skills</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded bg-gray-50 dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a]">
                  {SKILL_OPTIONS.map(skill => (
                    <label key={skill} className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={currentStaff.skill_tags.includes(skill)}
                        onChange={e => {
                          setCurrentStaff(f => ({
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
                <textarea className="w-full rounded border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 p-2" value={currentStaff.notes} onChange={e => setCurrentStaff(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="active" checked={currentStaff.active} onChange={e => setCurrentStaff(f => ({ ...f, active: e.target.checked }))} />
                <label htmlFor="active" className="text-gray-700 dark:text-blue-200">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {isAddModalOpen ? 'Add Staff' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="flex-1 bg-gray-300 dark:bg-[#2d437a] hover:bg-gray-400 dark:hover:bg-[#1e3555] text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Category Modal Component
function AddCategoryModal({ isOpen, onClose, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    color: 'bg-blue-400'
  });

  const colorOptions = [
    { value: 'bg-blue-400', label: 'Blue', color: 'bg-blue-400' },
    { value: 'bg-purple-400', label: 'Purple', color: 'bg-purple-400' },
    { value: 'bg-green-400', label: 'Green', color: 'bg-green-400' },
    { value: 'bg-red-400', label: 'Red', color: 'bg-red-400' },
    { value: 'bg-orange-400', label: 'Orange', color: 'bg-orange-400' },
    { value: 'bg-amber-400', label: 'Amber', color: 'bg-amber-400' },
    { value: 'bg-teal-400', label: 'Teal', color: 'bg-teal-400' },
    { value: 'bg-slate-400', label: 'Slate', color: 'bg-slate-400' },
    { value: 'bg-stone-400', label: 'Stone', color: 'bg-stone-400' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAdd(formData.name.trim(), formData.color);
      setFormData({ name: '', color: 'bg-blue-400' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Department</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Security Operations"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.color === option.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-300 dark:border-[#2d437a] hover:border-blue-300'
                  }`}
                >
                  <div className={`${option.color} h-6 w-full rounded mb-1`}></div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Add Department
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-[#2d437a] hover:bg-gray-400 dark:hover:bg-[#1e3555] text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Category Modal Component
function EditCategoryModal({ isOpen, category, onClose, onEdit, onDelete }: {
  isOpen: boolean;
  category: any;
  onClose: () => void;
  onEdit: (categoryId: number, name: string, color: string) => void;
  onDelete: (categoryId: number) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    color: 'bg-blue-400'
  });

  const colorOptions = [
    { value: 'bg-blue-400', label: 'Blue', color: 'bg-blue-400' },
    { value: 'bg-purple-400', label: 'Purple', color: 'bg-purple-400' },
    { value: 'bg-green-400', label: 'Green', color: 'bg-green-400' },
    { value: 'bg-red-400', label: 'Red', color: 'bg-red-400' },
    { value: 'bg-orange-400', label: 'Orange', color: 'bg-orange-400' },
    { value: 'bg-amber-400', label: 'Amber', color: 'bg-amber-400' },
    { value: 'bg-teal-400', label: 'Teal', color: 'bg-teal-400' },
    { value: 'bg-slate-400', label: 'Slate', color: 'bg-slate-400' },
    { value: 'bg-stone-400', label: 'Stone', color: 'bg-stone-400' },
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && category) {
      onEdit(category.id, formData.name.trim(), formData.color);
      onClose();
    }
  };

  const handleDelete = () => {
    if (category && confirm(`Are you sure you want to delete "${category.name}"? This will also delete all positions in this department.`)) {
      onDelete(category.id);
      onClose();
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Department</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Security Operations"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.color === option.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-300 dark:border-[#2d437a] hover:border-blue-300'
                  }`}
                >
                  <div className={`${option.color} h-6 w-full rounded mb-1`}></div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-3">
              Deleting this department will also remove all positions within it. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded font-medium transition-colors"
            >
              Delete Department
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-[#2d437a] hover:bg-gray-400 dark:hover:bg-[#1e3555] text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}