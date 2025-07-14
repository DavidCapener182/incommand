"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { UserGroupIcon, KeyIcon, DevicePhoneMobileIcon, CalendarDaysIcon, IdentificationIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import ReactDOM from "react-dom";

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

// Move this to the top of the file, above CallsignAssignmentView:

type Category = {
  id: number;
  name: string;
  color: string;
  positions: any[];
};

// 1. Move defaultCategories definition to the top of the file
const defaultCategories: Category[] = [
  { id: 1, name: 'Management', color: 'bg-purple-400', positions: [] },
  { id: 2, name: 'Internal Security', color: 'bg-blue-400', positions: [] },
  { id: 3, name: 'External Security', color: 'bg-green-400', positions: [] },
  { id: 4, name: 'Venue Operations', color: 'bg-orange-400', positions: [] },
  { id: 5, name: 'Medical & Welfare', color: 'bg-red-400', positions: [] },
  { id: 6, name: 'Traffic & Logistics', color: 'bg-slate-400', positions: [] },
];

// Add at the top of the file (after imports):
type Position = {
  id: string;
  callsign: string;
  position: string;
  short?: string;
  post?: string;
  required?: boolean;
  assignedStaff?: string | null;
  skills_required?: string[];
};

export default function StaffCommandCentre() {
  const [activeView, setActiveView] = useState('callsign');
  const [currentName, setCurrentName] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
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
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [staff, setStaff] = useState<any[]>([]);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const { data: posData, error: posError } = await supabase
          .from('callsign_positions')
          .select('*')
          .eq('event_id', eventId);
        if (posError) throw posError;

        const { data: assignData, error: assignError } = await supabase
          .from('callsign_assignments')
          .select('*');
        if (assignError) throw assignError;

        setPositions(posData || []);
        setAssignments(assignData || []);
      } catch (err) {
        setError((err as any).message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Group positions by area for display
  const groupedByArea = positions.reduce((acc: Record<string, any[]>, pos: any) => {
    const area = pos.area || "Uncategorized";
    if (!acc[area]) acc[area] = [];
    acc[area].push(pos);
    return acc;
  }, {});

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
      const roles = categories.flatMap((category: Category) =>
        category.positions.map((pos: any) => {
          const base = {
            event_id: eventId,
            area: category.name,
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
        const match = categories
          .flatMap((cat: Category) => cat.positions)
          .find((p: Position) =>
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

 

  // Status color helper
  const getStatusColor = (pos: any) => {
    if (assignments[pos.id]) return "bg-green-500"; // assigned
    if (pos.pending) return "bg-amber-400"; // pending/temporary
    return "bg-gray-300"; // unassigned
  };

  // Inside the main component, after categories is defined:
  const assignedStaffIds = categories.flatMap((cat: Category) =>
    (cat.positions as Position[]).map((pos: Position) => pos.assignedStaff?.toString()).filter(Boolean)
  );
  const unassignedStaff = staff.filter((staff: any) => !assignedStaffIds.includes(staff.id.toString()));

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
  console.log('CallsignAssignmentView mounted');
  // Default categories with better structure
  const defaultCategories: Category[] = [
    { id: 1, name: 'Management', color: 'bg-purple-400', positions: [] },
    { id: 2, name: 'Internal Security', color: 'bg-blue-400', positions: [] },
    { id: 3, name: 'External Security', color: 'bg-green-400', positions: [] },
    { id: 4, name: 'Venue Operations', color: 'bg-orange-400', positions: [] },
    { id: 5, name: 'Medical & Welfare', color: 'bg-red-400', positions: [] },
    { id: 6, name: 'Traffic & Logistics', color: 'bg-slate-400', positions: [] },
  ];

  type Category = {
    id: number;
    name: string;
    color: string;
    positions: Position[];
  };

  const [globalSearch, setGlobalSearch] = useState('');
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
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
        .select('id, full_name, contact_number, email, skill_tags, notes, active')
        .eq('company_id', userCompanyId)
        .eq('active', true)
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

  // Get assigned staff IDs
  const assignedStaffIds = categories.flatMap((cat: Category) =>
    (cat.positions as Position[]).map((pos: Position) => pos.assignedStaff?.toString()).filter(Boolean)
  );

  const unassignedStaff = staff.filter((staff: any) => !assignedStaffIds.includes(staff.id.toString()));
  // End of Selection

  // Filter positions based on global search
  const filteredCategories = categories.map(category => ({
    ...category,
    positions: !globalSearch.trim()
      ? category.positions
      : category.positions.filter(position => 
          position.callsign.toLowerCase().includes(globalSearch.toLowerCase()) ||
          position.position.toLowerCase().includes(globalSearch.toLowerCase()) ||
          (position.assignedStaff && staff.find(s => s.id === position.assignedStaff)?.name.toLowerCase().includes(globalSearch.toLowerCase()))
        )
  })).filter(category => category.positions.length > 0 || globalSearch === '');

  // Define fetchRoles as a standalone function inside CallsignAssignmentView
  async function fetchRoles() {
    if (!eventId) return;
    // Fetch roles
    const { data: roles, error } = await supabase
      .from('callsign_positions')
      .select('id, area, short_code, callsign, position, post, required, skills_required')
      .eq('event_id', eventId);
    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    // Fetch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('callsign_assignments')
      .select('id, callsign_role_id, staff_id, staff_name, event_id')
      .eq('event_id', eventId);
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return;
    }
    // Debug: print all area and category names
    console.log('All role.area values:', roles.map(r => r.area));
    console.log('All category.name values:', defaultCategories.map(c => c.name));
    // Build assignment map
    const assignmentMap: Record<string, string | null> = {};
    assignments?.forEach(a => {
      assignmentMap[String(a.callsign_role_id)] = a.staff_name || null;
    });
    // Map roles to categories using robust partial match
    const newCategories: Category[] = defaultCategories.map(cat => ({ ...cat, positions: [] as Position[] }));
    roles.forEach(role => {
      const roleArea = (role.area || '').replace(/\s+/g, '').toLowerCase();
      const category = newCategories.find(cat => {
        const catName = cat.name.replace(/\s+/g, '').toLowerCase();
        return catName.includes(roleArea) || roleArea.includes(catName);
      });
      if (category) {
        category.positions.push({
          id: String(role.id),
          callsign: role.callsign,
          position: role.position,
          short: role.short_code,
          post: role.post,
          required: role.required,
          assignedStaff: assignmentMap[String(role.id)] || null,
          skills_required: role.skills_required || [],
        });
      } else {
        console.warn('Unmatched role area:', role.area, role);
      }
    });
    console.log('Final categories state before setCategories:', newCategories);
    setCategories(newCategories);
  }

  // Update assignStaff, unassignStaff, and addPosition to use fetchRoles
  const assignStaff = async (categoryId: number, positionId: string, staffId: string) => {
    if (!eventId) return;
    await supabase.from('callsign_assignments').upsert({
      event_id: eventId,
      callsign_role_id: positionId,
      assigned_name: staff.find(s => s.id === staffId)?.name || '',
      position_id: positionId,
      user_id: staffId,
      assigned_at: new Date().toISOString(),
      unassigned_at: null,
    }, { onConflict: 'position_id' });
    await fetchRoles();
    setPendingChanges(true);
  };

  const unassignStaff = async (categoryId: number, positionId: string) => {
    if (!eventId) return;
    await supabase.from('callsign_assignments').update({
      unassigned_at: new Date().toISOString(),
    }).eq('position_id', positionId);
    await fetchRoles();
    setPendingChanges(true);
  };

  const addPosition = async (categoryId: number, position: Omit<Position, 'id'> & { quantity?: number }) => {
    const quantity = position.quantity && position.quantity > 1 ? position.quantity : 1;
    let baseCallsign = position.callsign;
    let baseShort = position.short || baseCallsign;
    let match = baseCallsign.match(/^(.*?)(\d+)$/);
    let prefix = match ? match[1] : baseCallsign;
    let startNum = match ? parseInt(match[2], 10) : 1;

    const newPositions = Array.from({ length: quantity }, (_, i) => {
      let callsign = quantity > 1 ? `${prefix}${startNum + i}` : baseCallsign;
      let short = quantity > 1 ? `${prefix}${startNum + i}` : baseShort;
      return {
        ...position,
        callsign,
        short,
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        skills_required: position.skills_required || [],
      };
    });

    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, positions: [...cat.positions, ...newPositions] }
        : cat
    ));
    setPendingChanges(true);
    // Save to Supabase
    if (!eventId) return;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const rolesToInsert = newPositions.map(pos => ({
      event_id: eventId,
      area: category.name,
      short_code: pos.short,
      callsign: pos.callsign,
      position: pos.position || '',
      post: pos.post || '',
      required: pos.required ?? false,
      skills_required: pos.skills_required || [],
    }));
    await supabase.from('callsign_positions').upsert(rolesToInsert, { onConflict: 'event_id,area,short_code' });
    await fetchRoles();
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

      // 1. Upsert all positions (callsign_positions)
      const roles = categories.flatMap((category: Category) =>
        category.positions.map((pos: any) => {
          const key = `${category.name}|${pos.short || pos.callsign}`;
          return {
            id: roleIdMap.get(key) || uuidv4(),
            event_id: eventId,
            area: category.name,
            short_code: pos.short || pos.callsign,
            callsign: pos.callsign,
            position: pos.position || '',
            post: pos.post || '',
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
        category.positions.map(pos => ({
          event_id: eventId,
          callsign_role_id: (uniqueRoles.find(r => r.area === category.name && r.short_code === (pos.short || pos.callsign)) || {}).id,
          assigned_name: pos.assignedStaff || null,
        }))
      );
      if (assignmentsArr.length > 0) {
        const { error: assignError } = await supabase
          .from("callsign_assignments")
          .upsert(assignmentsArr, { onConflict: "event_id,position_id,user_id" });
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

  // Add debug logs outside JSX
  console.log('Rendering debug panel');
  console.log('Rendering AddPositionModal');

  // Add debug log to see categories at render time
  console.log('Rendering categories:', categories);

  // Add debug log to see categories and positions at render time
  categories.forEach((cat: Category) => {
    console.log(`Category: ${cat.name}, Positions count: ${cat.positions.length}`, cat.positions);
  });

  // Inside CallsignAssignmentView, before return:
  const allPositions = categories.flatMap(cat => cat.positions);
  const groupedByArea = allPositions.reduce((acc: Record<string, any[]>, pos: any) => {
    const area = pos.area || "Uncategorized";
    if (!acc[area]) acc[area] = [];
    acc[area].push(pos);
    return acc;
  }, {});

  return (
    <>
      {/* ... existing JSX ... */}
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
                  title={`${staff.full_name}${staff.skill_tags && staff.skill_tags.length > 0 ? '\nSkills: ' + staff.skill_tags.join(', ') : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-xs flex-shrink-0">
                      {staff.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white text-xs truncate">{staff.full_name}</div>
                  </div>
                  {/* Tooltip */}
                  {staff.skill_tags && staff.skill_tags.length > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                        <div className="font-medium mb-1">{staff.full_name}</div>
                        <div className="text-gray-300">Skills: {staff.skill_tags.join(', ')}</div>
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
          {categories.map((category: Category) => (
            <div key={category.id} className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200" style={{ overflow: 'visible' }}>
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
                    {category.positions.map((position: Position) => {
                      const assignedStaff = position.assignedStaff 
                        ? staff.find(s => s.id === position.assignedStaff)
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
        {/* Save Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={saveChanges}
            disabled={!pendingChanges}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors shadow-md ${pendingChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            {pendingChanges ? 'Save Changes' : 'All Changes Saved'}
          </button>
        </div>
      </div>
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
      <div>
        {Object.entries(groupedByArea).map(([area, areaPositions]) => (
          <div key={area}>
            <h2>{area}</h2>
            <ul>
              {(areaPositions as any[]).map((pos: any) => (
                <li key={pos.id}>{pos.callsign}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
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
  onAssign: (staffId: string) => void;
  onUnassign: () => void;
  onEdit: () => void;
}) {
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number, width: number, dropUp: boolean} | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

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

  // Calculate dropdown position on open
  React.useEffect(() => {
    if (showAssignMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // px, matches max-h-48
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropUp = spaceBelow < dropdownHeight;
      setDropdownPos({
        top: dropUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        dropUp,
      });
    } else if (!showAssignMenu) {
      setDropdownPos(null);
    }
  }, [showAssignMenu]);

  // Only show staff with the required skill for this position
  const eligibleStaff = React.useMemo(() => {
    if (!Array.isArray(position.skills_required) || position.skills_required.length === 0) return unassignedStaff;
    return unassignedStaff.filter(staff =>
      Array.isArray(staff.skills) &&
      position.skills_required.every((req: string) => staff.skills.includes(req))
    );
  }, [unassignedStaff, position.skills_required]);

  // Dropdown menu element
  const dropdownMenu = dropdownPos && showAssignMenu ? (
    <div
      className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#182447] border border-gray-200 dark:border-[#2d437a] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50"
      style={{ zIndex: 50, top: '100%' }}
    >
      {eligibleStaff.length === 0 ? (
        <div className="p-2 text-xs text-gray-500 dark:text-gray-400">No available staff</div>
      ) : (
        eligibleStaff.map((staff) => (
          <button
            key={staff.id}
            type="button"
            onClick={e => {
              e.preventDefault();
              console.log('Assign button clicked for staffId:', staff.id);
              onAssign(staff.id);
              setTimeout(() => setShowAssignMenu(false), 0);
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
  ) : null;

  useEffect(() => {
    console.log('[PositionCard] position.id:', position.id, 'assignedStaff:', position.assignedStaff, 'assignedStaff prop:', assignedStaff);
    if (unassignedStaff && unassignedStaff.length > 0) {
      console.log('[PositionCard] unassignedStaff IDs:', unassignedStaff.map(s => s.id));
    }
  }, [position, assignedStaff, unassignedStaff]);

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
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{position.callsign}</div>
            {position.role && (
              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{position.role}</div>
            )}
            {position.post && (
              <div className="text-xs text-gray-400 dark:text-gray-400 truncate">{position.post}</div>
            )}
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
            <div className="relative flex-1 assign-dropdown-container">
              <button
                ref={buttonRef}
                onClick={() => setShowAssignMenu(!showAssignMenu)}
                className="w-full px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 rounded transition-colors"
              >
                Assign
              </button>
              {dropdownMenu}
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
    role: '',
    post: '',
    categoryId: selectedCategory || categories[0]?.id || 1,
    required: false,
    quantity: 1,
    skills_required: [] as string[],
  });

  useEffect(() => {
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, categoryId: selectedCategory }));
    }
  }, [selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.callsign.trim() && formData.role.trim() && formData.post.trim()) {
      onAdd(formData.categoryId, {
        callsign: formData.callsign.trim(),
        position: formData.role.trim(),
        post: formData.post.trim(),
        required: formData.required,
        quantity: formData.quantity,
        skills_required: formData.skills_required,
      });
      setFormData({ callsign: '', role: '', post: '', categoryId: categories[0]?.id || 1, required: false, quantity: 1, skills_required: [] });
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
            <select
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a skill/role</option>
              {SKILL_OPTIONS.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
      </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Position/Post
            </label>
            <input
              type="text"
              value={formData.post}
              onChange={(e) => setFormData(prev => ({ ...prev, post: e.target.value }))}
              placeholder="e.g., Stage Left, Pit Supervisor"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={e => setFormData(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Required Skills
            </label>
            <select
              multiple
              value={formData.skills_required}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                setFormData(prev => ({ ...prev, skills_required: options }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SKILL_OPTIONS.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
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
  const [loadingStaff, setLoadingStaff] = useState(false);
  // Sorting and filtering state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'full_name' | 'active' | 'skills'>('full_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [skillsExpanded, setSkillsExpanded] = useState<{ [id: string]: boolean }>({});

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
        .eq('active', true)
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

  // Filtering and sorting logic
  const filteredStaff = React.useMemo(() => {
    let filtered = staff;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((member) =>
        member.full_name?.toLowerCase().includes(s) ||
        member.email?.toLowerCase().includes(s) ||
        member.contact_number?.toLowerCase().includes(s) ||
        (member.skill_tags && member.skill_tags.some((tag: string) => tag.toLowerCase().includes(s))) ||
        (typeof member.active === "boolean" && (s === "active" ? member.active : s === "inactive" ? !member.active : false))
      );
    }
    // Sorting
    return [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'skills') {
        aVal = a.skill_tags ? a.skill_tags.join(', ') : '';
        bVal = b.skill_tags ? b.skill_tags.join(', ') : '';
      } else if (sortBy === 'active') {
        aVal = a.active ? 1 : 0;
        bVal = b.active ? 1 : 0;
      } else {
        aVal = a[sortBy] || '';
        bVal = b[sortBy] || '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [staff, search, sortBy, sortDir]);

  function handleSort(col: 'full_name' | 'active' | 'skills') {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Staff Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your team members and their details</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
          <input
            type="text"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, skill, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff
          </button>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('full_name')}>
                    Name {sortBy === 'full_name' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('skills')}>
                    Skills {sortBy === 'skills' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('active')}>
                    Status {sortBy === 'active' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2d437a]">
                {filteredStaff.map((member) => {
                  const skills = member.skill_tags || [];
                  const showCount = 5;
                  const expanded = !!skillsExpanded[member.id];
                  return (
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
                        <div
                          className="flex flex-wrap gap-1 items-center"
                        >
                          {skills.length <= showCount || expanded ? (
                            <>
                              {skills.map((skill: string) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 whitespace-nowrap md:px-2.5 md:py-0.5"
                                  style={{ minWidth: 0 }}
                                >
                                  {skill}
                                </span>
                              ))}
                              {skills.length > showCount && (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 ml-1 whitespace-nowrap md:px-2.5 md:py-0.5"
                                  style={{ minWidth: 0 }}
                                  onClick={() => setSkillsExpanded(prev => ({ ...prev, [member.id]: false }))}
                                >
                                  Show less
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {skills.slice(0, showCount).map((skill: string) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 whitespace-nowrap md:px-2.5 md:py-0.5"
                                  style={{ minWidth: 0 }}
                                >
                                  {skill}
                                </span>
                              ))}
                              <button
                                type="button"
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 ml-1 whitespace-nowrap md:px-2.5 md:py-0.5"
                                style={{ minWidth: 0 }}
                                onClick={() => setSkillsExpanded(prev => ({ ...prev, [member.id]: true }))}
                              >
                                (+{skills.length - showCount} more)
                              </button>
                            </>
                          )}
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
                  );
                })}
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

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Delete Department
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