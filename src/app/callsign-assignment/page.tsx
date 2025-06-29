"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserGroupIcon, KeyIcon, DevicePhoneMobileIcon, CalendarDaysIcon, IdentificationIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { v4 as uuidv4, validate as validateUUID } from 'uuid';

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
  { name: 'Staff Management', icon: UserGroupIcon, key: 'staff' },
  { name: 'Callsign Assignment', icon: KeyIcon, key: 'callsign' },
  { name: 'Radio Sign Out', icon: DevicePhoneMobileIcon, key: 'radio' },
  { name: 'Shift Roster', icon: CalendarDaysIcon, key: 'shift' },
  { name: 'Accreditation', icon: IdentificationIcon, key: 'accreditation' },
];

const SKILL_OPTIONS = [
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

// Add this type above StaffListView
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
        .from("callsign_roles")
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
      {/* Sidebar - pixel-perfect match to settings sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] flex-col shadow-lg z-10">
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
        {/* TODO: Add mobile nav/drawer for sidebar on small screens */}
      </aside>
      {/* Main content area */}
      <main className="flex-1 p-8 bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
        <div className="w-full h-full">
          {activeView === 'staff' && <StaffListView />}
          {activeView === 'callsign' && <CallsignAssignmentView eventId={eventId} />}
          {activeView === 'radio' && <RadioSignOut />}
          {activeView === 'shift' && <ShiftRoster />}
          {activeView === 'accreditation' && <Accreditation />}
        </div>
      </main>
    </div>
  );
}

// --- Callsign Assignment View with staff search, unassigned staff, and assignment UI ---
function CallsignAssignmentView({ eventId }: { eventId: string | null }) {
  // Default categories with better structure
  const defaultCategories = [
    { id: 1, name: 'Management', color: 'bg-purple-400', positions: [] },
    { id: 2, name: 'Internal Security', color: 'bg-blue-400', positions: [] },
    { id: 3, name: 'External Security', color: 'bg-green-400', positions: [] },
    { id: 4, name: 'Venue Operations', color: 'bg-orange-400', positions: [] },
    { id: 5, name: 'Medical & Welfare', color: 'bg-red-400', positions: [] },
    { id: 6, name: 'Traffic & Logistics', color: 'bg-slate-400', positions: [] },
  ];

  type Position = { 
    id: string;
    callsign: string; 
    position: string;
    short?: string;
    assignedStaff?: number;
    required?: boolean;
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

  // Real staff data from Supabase
  const [staffList, setStaffList] = useState<any[]>([]);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

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
        .select('id, full_name, skill_tags, notes, active')
        .eq('company_id', userCompanyId)
        .eq('active', true)
        .order('full_name');
      
      if (error) throw error;

      const formattedStaff = data?.map(staff => ({
        id: staff.id,
        name: staff.full_name,
        role: staff.skill_tags?.[0] || 'Staff Member',
        skills: staff.skill_tags || [],
        avatar: '👤'
      })) || [];

      setStaffList(formattedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoadingStaff(false);
    }
  }

  // Get assigned staff IDs
  const assignedStaffIds = categories.flatMap(cat => 
    cat.positions.map(pos => pos.assignedStaff).filter(Boolean)
  );

  const unassignedStaff = staffList.filter(staff => !assignedStaffIds.includes(staff.id));

  // Filter positions based on global search
  const filteredCategories = categories.map(category => ({
    ...category,
    positions: category.positions.filter(position => 
      position.callsign.toLowerCase().includes(globalSearch.toLowerCase()) ||
      position.position.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (position.assignedStaff && staffList.find(s => s.id === position.assignedStaff)?.name.toLowerCase().includes(globalSearch.toLowerCase()))
    )
  })).filter(category => 
    category.positions.length > 0 || globalSearch === ''
  );

  // Assign staff to position
  const assignStaff = (categoryId: number, positionId: string, staffId: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            positions: cat.positions.map(pos => 
              pos.id === positionId 
                ? { ...pos, assignedStaff: staffId }
                : pos
            )
          }
          : cat
      ));
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
        .from('callsign_roles')
        .select('id, area, short_code')
        .eq('event_id', eventId);
      if (fetchError) throw fetchError;
      const roleIdMap = new Map();
      (existingRoles || []).forEach(role => {
        roleIdMap.set(`${role.area}|${role.short_code}`, role.id);
      });

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
      const { error: rolesError } = await supabase.from('callsign_roles').upsert(uniqueRoles, { onConflict: 'event_id,area,short_code' });
      if (rolesError) throw rolesError;
      const idMap: Record<string, string> = {};
      uniqueRoles.forEach(role => {
        idMap[role.id] = role.id;
      });
      // 2. Upsert all assignments (callsign_assignments)
      const assignmentsArr = categories.flatMap(category =>
        category.positions.map(pos => ({
          event_id: eventId,
          role_id: (uniqueRoles.find(r => r.area === category.name && r.short_code === (pos.short || pos.callsign)) || {}).id,
        }))
      );
      if (assignmentsArr.length > 0) {
        const { error: assignError } = await supabase
          .from("callsign_assignments")
          .upsert(assignmentsArr, { onConflict: "event_id,role_id" });
        if (assignError) throw assignError;
      }
      alert("Assignments and roles saved successfully.");
    } catch (err: any) {
      alert("Error saving: " + (err.message || err));
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#101c36] transition-colors duration-300">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#23408e] border-b border-gray-200 dark:border-[#2d437a] shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Callsign Assignment</h1>
                <p className="text-sm text-gray-500 dark:text-gray-300">Manage staff assignments and callsigns</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-3 flex-1 lg:flex-none lg:w-96">
              <div className="relative flex-1">
        <input
          type="text"
                  placeholder="Search by callsign, role, or staff name..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
      </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#2d437a] hover:bg-gray-200 dark:hover:bg-[#23408e] rounded-lg transition-colors"
              >
                + Department
              </button>
              <button
                onClick={() => setShowAddPositionModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 rounded-lg transition-colors"
              >
                + Position
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {categories.reduce((sum, cat) => sum + cat.positions.length, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Total Positions</div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {assignedStaffIds.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Assigned</div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {categories.reduce((sum, cat) => sum + cat.positions.length, 0) - assignedStaffIds.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Vacant</div>
          </div>
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {unassignedStaff.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Available Staff</div>
          </div>
        </div>

        {/* Available Staff Section */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-4 mb-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Available Staff</h2>
              <p className="text-xs text-gray-500 dark:text-gray-300">Drag and drop staff to assign them to positions</p>
            </div>
            <span className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-medium">
              {unassignedStaff.length} available
            </span>
          </div>
          
          {unassignedStaff.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <div className="text-lg mb-1">👥</div>
              <div className="font-medium text-sm mb-1">All staff assigned</div>
              <div className="text-xs">Great job! All available staff have been assigned to positions.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {unassignedStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="relative bg-gray-50 dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a] rounded-lg p-2 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 group"
                  title={`${staff.name}${staff.skills && staff.skills.length > 0 ? '\nSkills: ' + staff.skills.join(', ') : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-xs flex-shrink-0">
                      {staff.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white text-xs truncate">{staff.name}</div>
                  </div>
                  
                  {/* Tooltip */}
                  {staff.skills && staff.skills.length > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                        <div className="font-medium mb-1">{staff.name}</div>
                        <div className="text-gray-300">Skills: {staff.skills.join(', ')}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Cards */}
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              {/* Department Header - Made Much Smaller */}
              <div className={`${category.color} px-4 py-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{category.name}</h2>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                      {category.positions.length} positions
                    </span>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                      {category.positions.filter(p => p.assignedStaff).length} assigned
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
              <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowEditCategoryModal(true);
                      }}
                      className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="Edit Department"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowAddPositionModal(true);
                      }}
                      className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="Add Position"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
              </button>
            </div>
                </div>
              </div>

              {/* Positions Grid */}
              <div className="p-3">
                {category.positions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-sm font-medium mb-1">No positions yet</div>
                    <div className="text-xs">Click the + button above to add positions to this department</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                    {category.positions.map((position) => {
                      const assignedStaff = position.assignedStaff 
                        ? staffList.find(s => s.id === position.assignedStaff)
                        : null;

                return (
                        <PositionCard
                          key={position.id}
                          position={position}
                          assignedStaff={assignedStaff}
                          category={category}
                          unassignedStaff={unassignedStaff}
                          onAssign={(staffId) => assignStaff(category.id, position.id, staffId)}
                          onUnassign={() => unassignStaff(category.id, position.id)}
                          onEdit={() => setEditingPosition(position)}
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

      {/* Fixed Save Bar */}
      {pendingChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="font-medium">You have unsaved changes</span>
            <button
              onClick={saveChanges}
              className="bg-white text-blue-600 px-4 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
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
          // Update position logic here
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
    </div>
  );
}

// Position Card Component
function PositionCard({ 
  position, 
  assignedStaff, 
  category, 
  unassignedStaff, 
  onAssign, 
  onUnassign, 
  onEdit 
}: {
  position: any;
  assignedStaff: any;
  category: any;
  unassignedStaff: any[];
  onAssign: (staffId: number) => void;
  onUnassign: () => void;
  onEdit: () => void;
}) {
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAssignMenu) {
        const target = event.target as Element;
        if (!target.closest('.assign-dropdown-container')) {
          setShowAssignMenu(false);
        }
      }
    };

    if (showAssignMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssignMenu]);

  return (
    <div className={`relative bg-white dark:bg-[#182447] rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
      assignedStaff 
        ? 'border-green-300 dark:border-green-600 shadow-md' 
        : 'border-gray-200 dark:border-[#2d437a] hover:border-blue-300 dark:hover:border-blue-500'
    }`}>
      {/* Status Indicator */}
      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
        assignedStaff ? 'bg-green-500' : 'bg-orange-400'
      }`}>
        {assignedStaff ? '✓' : '!'}
      </div>

      <div className="p-2">
        {/* Header with Callsign & Position */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{position.callsign}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{position.position}</div>
          </div>
          <button
            onClick={onEdit}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            title="Edit position"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Assigned Staff */}
                    {assignedStaff ? (
          <div className="mb-2">
            <div className="flex items-center gap-2 p-1.5 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-700 dark:text-green-200 font-bold text-xs flex-shrink-0">
                {assignedStaff.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-green-900 dark:text-green-100 text-xs truncate">{assignedStaff.name}</div>
              </div>
                        <button
                onClick={onUnassign}
                className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex-shrink-0"
                title="Unassign staff"
                        >
                ×
                        </button>
            </div>
                      </div>
                    ) : (
          <div className="mb-2">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700 text-center">
              <div className="text-orange-600 dark:text-orange-300 text-xs font-medium">Vacant</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!assignedStaff && (
          <div className="flex gap-1">
            <div className="relative flex-1 assign-dropdown-container" style={{ zIndex: showAssignMenu ? 60 : 'auto' }}>
                      <button
                onClick={() => setShowAssignMenu(!showAssignMenu)}
                className="w-full px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 rounded transition-colors"
                      >
                Assign
                      </button>
              
              {/* Assignment Dropdown */}
              {showAssignMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a] rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 9999 }}>
                          {unassignedStaff.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500 dark:text-gray-400">No available staff</div>
                          ) : (
                    unassignedStaff.map((staff) => (
                                <button
                        key={staff.id}
                                  onClick={() => {
                          onAssign(staff.id);
                          setShowAssignMenu(false);
                        }}
                        className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-[#2d437a] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-xs">
                            {staff.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-xs">{staff.name}</div>
                          </div>
                        </div>
                                </button>
                              ))
                          )}
                        </div>
              )}
            </div>
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
  const [formData, setFormData] = useState({
    callsign: '',
    position: '',
    categoryId: selectedCategory || categories[0]?.id || 1,
    required: false
  });

  useEffect(() => {
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategory }));
    }
  }, [selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.callsign.trim() && formData.position.trim()) {
      onAdd(formData.categoryId, {
        callsign: formData.callsign.trim(),
        position: formData.position.trim(),
        required: formData.required
      });
      setFormData({ callsign: '', position: '', categoryId: categories[0]?.id || 1, required: false });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Position</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Department
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-200 dark:bg-[#2d437a] text-gray-700 dark:text-gray-100">Cancel</button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Add Position</button>
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
  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Position</h2>
        {/* Edit form would go here */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-[#2d437a] hover:bg-gray-300 dark:hover:bg-[#23408e] rounded-lg transition-colors"
          >
            Cancel
          </button>
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
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('company_id', userCompanyId)
        .order('full_name');
      
      if (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      } else {
    setStaff(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching staff:', err);
      setStaff([]);
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Staff Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your team members and their details</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No staff found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Get started by adding your first team member</p>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#2d437a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#2d437a]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                          <span className="text-blue-700 dark:text-blue-200 font-medium text-sm">
                            {member.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {member.contact_number || 'Not provided'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(member.skill_tags || []).map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.active 
                          ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                      }`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                      >
                        Delete
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