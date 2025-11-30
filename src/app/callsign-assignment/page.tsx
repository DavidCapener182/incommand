"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  UserGroupIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  Squares2X2Icon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  UsersIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Link from "next/link";
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
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

type Position = {
  id: string;
  callsign: string;
  position: string;
  short?: string;
  assignedStaff?: string;
  assignedName?: string;
  required?: boolean;
  skills?: string[];
};

type Category = {
  id: number;
  name: string;
  color: string;
  positions: Position[];
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Management', color: 'bg-purple-500', positions: [] },
  { id: 2, name: 'Internal', color: 'bg-blue-500', positions: [] },
  { id: 3, name: 'External', color: 'bg-green-500', positions: [] },
  { id: 4, name: 'Venue Operations', color: 'bg-orange-500', positions: [] },
  { id: 5, name: 'Medical', color: 'bg-red-500', positions: [] },
  { id: 6, name: 'Traffic Management', color: 'bg-slate-500', positions: [] },
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
  "Head of Security (HOS)", "Deputy Head of Security", "Security Manager", "Supervisor",
  "SIA Security Officer", "(SIA)", "Steward", "Control Room Operator", "Event Control Manager",
  "Radio Controller", "Welfare Team", "Medic / Paramedic", "Traffic Marshal", "Traffic Management",
  "Venue Manager", "Duty Manager", "Site Manager", "Access Control", "Accreditation",
  "Production Manager", "Stage Manager", "Artist Liaison", "Front of House", "Fire Steward",
  "Health & Safety", "Dog Handler (K9)", "CCTV Operator", "Logistics Coordinator",
];

// --- TOAST NOTIFICATION SYSTEM ---
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium cursor-pointer transition-all animate-in slide-in-from-right-full ${
            toast.type === 'success' ? 'bg-green-600' : 
            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' && <CheckIcon className="w-5 h-5" />}
          {toast.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
};

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
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [eventLoading, setEventLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  // Fetch current event on mount
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      setEventLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, event_name")
          .eq("is_current", true)
          .single();
        if (error) throw error;
        if (data) {
          setEventId((data as any).id);
          setEventName((data as any).event_name || "");
        }
      } catch (err: any) {
        console.error("Error loading event:", err);
      } finally {
        setEventLoading(false);
      }
    };
    fetchCurrentEvent();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#15192c] transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-none border-r border-gray-200 dark:border-[#2d437a] flex-col bg-white dark:bg-[#1a2a57] print:hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#2d437a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#23408e] flex items-center justify-center text-white">
              <Squares2X2Icon className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Command</span>
          </div>
          {eventId && (
            <div className="mt-2 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-200 truncate">
              {eventName}
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left
                  ${isActive 
                    ? 'bg-[#23408e] text-white shadow-md shadow-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#233566]'
                  }
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {activeView === 'staff' && <StaffListView addToast={addToast} />}
          {activeView === 'callsign' && <CallsignAssignmentView eventId={eventId} eventLoading={eventLoading} addToast={addToast} eventName={eventName} />}
          {activeView === 'radio' && <RadioSignOut />}
        </div>
      </main>
    </div>
  );
}

// --- Callsign Assignment View with staff search, unassigned staff, and assignment UI ---
function CallsignAssignmentView({ eventId, eventLoading, addToast, eventName }: { eventId: string | null, eventLoading: boolean, addToast: any, eventName: string }) {
  // Default categories with better structure - matching database areas
  const [categories, setCategories] = useState<Category[]>(() => DEFAULT_CATEGORIES.map(cat => ({ ...cat, positions: [] })));
  const [globalSearch, setGlobalSearch] = useState('');
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddTempStaffModal, setShowAddTempStaffModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{categoryId: number, positionId: string} | null>(null);
  const [assigningToPosition, setAssigningToPosition] = useState<{categoryId: number, positionId: string} | null>(null);
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
      roles?.forEach((role: any) => {
        if (!areaMap[role.area]) areaMap[role.area] = [];
        // Find assignment for this role
        const assignment = assignments?.find((a: any) => a.position_id === role.id);
        if ((assignment as any)?.assigned_name) assignedNamesArr.push((assignment as any).assigned_name);
        areaMap[role.area].push({
          id: role.id,
          callsign: role.callsign,
          short: role.short_code,
          position: role.position,
          required: role.required,
          assignedStaff: ((assignment as any)?.user_id as string) || undefined,
          assignedName: (assignment as any)?.assigned_name || undefined,
        });
      });
      // 4. Map to defaultCategories structure
      const newCategories = DEFAULT_CATEGORIES.map(cat => {
        const positions = areaMap[cat.name] || [];
        return { ...cat, positions };
      });
      setCategories(newCategories);
      setAssignedNames(assignedNamesArr);
    };
    fetchRolesAndAssignments();
    // Only run when eventId or userCompanyId changes
  }, [eventId, userCompanyId]);

  const fetchUserCompany = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if ((profile as any)?.company_id) {
        setUserCompanyId((profile as any).company_id);
      } else {
        console.log("No company ID available, skipping staff fetch");
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
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

      const formattedStaff = data?.map((staff: any) => ({
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
  }, [userCompanyId]);

  // Load staff data from Supabase
  useEffect(() => {
    fetchUserCompany();
  }, [fetchUserCompany]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Stats
  const assignedCount = categories.flatMap(cat => cat.positions.filter(pos => pos.assignedStaff || pos.assignedName)).length;
  const assignedStaffIds = categories.flatMap(cat => cat.positions.map(pos => pos.assignedStaff).filter(Boolean));
  const unassignedStaff = staffList.filter(staff => !assignedStaffIds.includes(staff.id) && !assignedNames.includes(staff.full_name));

  const filteredCategories = categories.map(category => ({
    ...category,
    positions: category.positions.filter(position => 
      position.callsign.toLowerCase().includes(globalSearch.toLowerCase()) ||
      position.position.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (position.assignedStaff && staffList.find(s => s.id === position.assignedStaff)?.full_name.toLowerCase().includes(globalSearch.toLowerCase()))
    )
  })).filter(category => category.positions.length > 0 || globalSearch === '');

  // Actions
  const assignStaff = (categoryId: number, positionId: string, staffId: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      positions: cat.positions.map(pos => {
        if (pos.assignedStaff === staffId) return { ...pos, assignedStaff: undefined }; // Remove from old pos
        if (cat.id === categoryId && pos.id === positionId) return { ...pos, assignedStaff: staffId }; // Assign to new
        return pos;
      })
    })));
    setPendingChanges(true);
  };

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
      addToast("Position deleted", "success");
    } catch (err) {
      const e = err as any;
      addToast('Error deleting position: ' + (e.message || e), "error");
    }
    setPendingChanges(true);
  };

  const saveChanges = async () => {
    if (!eventId) {
      addToast("No current event selected.", "error");
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
      (existingRoles || []).forEach((role: any) => {
        roleIdMap.set(`${role.area}|${role.short_code}`, role.id);
      });

      // Fetch all valid user ids from profiles
      const { data: validUsers, error: userError } = await supabase
        .from('profiles')
        .select('id');
      if (userError) throw userError;
      const validUserIds = new Set((validUsers || []).map((u: any) => u.id));

      // 1. Upsert all positions (callsign_positions)
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
      const { error: rolesError } = await (supabase as any).from('callsign_positions').upsert(uniqueRoles, { onConflict: 'event_id,area,short_code' });
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
          } else if (pos.assignedStaff) {
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
        const { error: assignError } = await (supabase as any)
          .from("callsign_assignments")
          .upsert(assignmentsArr, { onConflict: "event_id,position_id" });
        if (assignError) throw assignError;
      }
      addToast("Roster saved successfully", "success");
    } catch (err: any) {
      addToast("Error saving: " + (err.message || err), "error");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Department', 'Callsign', 'Position', 'Assigned Staff', 'Status'];
    const rows = categories.flatMap(cat => 
      cat.positions.map(pos => {
        const staff = staffList.find(s => s.id === pos.assignedStaff);
        const assignee = staff?.full_name || pos.assignedName || 'Unassigned';
        return [
          cat.name,
          pos.callsign,
          pos.position,
          assignee,
          assignee !== 'Unassigned' ? 'Filled' : 'Vacant'
        ];
      })
    );

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roster_${eventName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Roster exported to CSV", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingStaff || eventLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#15192c] pb-24 print:bg-white print:pb-0">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#15192c]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#2d437a] px-6 py-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Callsign Assignment</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className={pendingChanges ? "text-amber-600 font-medium" : "text-green-600"}>
                {pendingChanges ? "Unsaved changes" : "All changes saved"}
              </span>
              <span>•</span>
              <span>{assignedCount} Assigned</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter positions..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#1a2a57] border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64 transition-all"
              />
            </div>
            
            <button 
              onClick={handleExportCSV}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-[#1a2a57] transition-colors"
              title="Export CSV"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-[#1a2a57] transition-colors"
              title="Print Roster"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={() => setShowAddPositionModal(true)}
              className="bg-[#23408e] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" /> Position
            </button>
          </div>
        </div>
      </div>

      {/* Available Staff Bar - Sticky below header */}
      <div className="sticky top-[73px] z-20 bg-white dark:bg-[#1a2a57] border-b border-gray-200 dark:border-[#2d437a] px-6 py-3 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Available Staff ({unassignedStaff.length})</h3>
          <button 
            onClick={() => setShowAddTempStaffModal(true)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            + Add Temp Staff
          </button>
        </div>
        
        {unassignedStaff.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-[88px] overflow-y-auto custom-scrollbar">
            {unassignedStaff.map(staff => (
              <div 
                key={staff.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", staff.id)}
                className="group flex items-center gap-2 bg-white dark:bg-[#1a2a57] border border-gray-300 dark:border-[#2d437a] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm px-3 py-1.5 rounded-full cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {staff.full_name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{staff.full_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic py-1">All staff currently assigned.</div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-8 print:p-0 print:space-y-4">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:break-inside-avoid">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-[#2d437a] pb-2">
              <div className={`w-3 h-8 rounded-r-md ${cat.color}`}></div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{cat.name}</h2>
              <span className="text-xs bg-gray-100 dark:bg-[#1a2a57] text-gray-500 px-2 py-0.5 rounded-full">
                {cat.positions.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.positions.map(pos => {
                const assigned = staffList.find(s => s.id === pos.assignedStaff);
                const assignedName = assigned?.full_name || pos.assignedName;
                
                return (
                  <div 
                    key={pos.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const staffId = e.dataTransfer.getData("text/plain");
                      if (staffId) assignStaff(cat.id, pos.id, staffId);
                    }}
                    className={`relative group p-4 rounded-lg border border-gray-200 dark:border-[#2d437a] transition-all duration-200 bg-white dark:bg-[#1a2a57] shadow-sm ${
                      assignedName ? 'border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    {/* Edit/Delete Actions - Top Right */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                      <button 
                        onClick={() => { setEditingPosition(pos); setSelectedCategory(cat.id); setShowAddPositionModal(true); }} 
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit position"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePosition(cat.id, pos.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete position"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Callsign and Position Title */}
                    <div className="mb-4 pr-12">
                      <div className="font-mono text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {pos.callsign}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {pos.position}
                      </div>
                    </div>

                    {/* Assignment Section */}
                    {assignedName ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <span className="text-green-600 font-bold">✓</span>
                          <span className="font-medium">{assignedName}</span>
                        </div>
                        <button 
                          onClick={() => assignStaff(cat.id, pos.id, '')}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Available for assignment.
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (unassignedStaff.length === 1) {
                                assignStaff(cat.id, pos.id, unassignedStaff[0].id);
                              } else {
                                setAssigningToPosition(assigningToPosition?.categoryId === cat.id && assigningToPosition?.positionId === pos.id ? null : { categoryId: cat.id, positionId: pos.id });
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Assign Staff
                          </button>
                          {assigningToPosition?.categoryId === cat.id && assigningToPosition?.positionId === pos.id && unassignedStaff.length > 1 && (
                            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1a2a57] border border-gray-200 dark:border-[#2d437a] rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                              {unassignedStaff.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    assignStaff(cat.id, pos.id, s.id);
                                    setAssigningToPosition(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#15192c] rounded text-sm text-gray-700 dark:text-gray-300"
                                >
                                  {s.full_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {unassignedStaff.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Suggested staff:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {unassignedStaff.slice(0, 3).map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => assignStaff(cat.id, pos.id, s.id)}
                                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#15192c] hover:bg-gray-200 dark:hover:bg-[#1a2a57] text-gray-700 dark:text-gray-300 rounded transition-colors"
                                >
                                  {s.full_name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Add Position Button (Card style) */}
              <button
                onClick={() => { setSelectedCategory(cat.id); setShowAddPositionModal(true); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2d437a] text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all print:hidden"
              >
                <PlusIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Add Position</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save FAB */}
      {pendingChanges && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 print:hidden animate-in slide-in-from-bottom-10">
          <button
            onClick={saveChanges}
            className="flex items-center gap-3 bg-[#23408e] text-white px-6 py-3 rounded-full shadow-xl hover:bg-blue-800 hover:scale-105 transition-all font-bold"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Save Changes
          </button>
        </div>
      )}

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <AddPositionModal 
          isOpen={showAddPositionModal}
          onClose={() => setShowAddPositionModal(false)}
          categories={categories}
          selectedCategory={selectedCategory}
          onAdd={(catId: number, pos: any) => {
            setCategories(prev => prev.map(c => c.id === catId ? { ...c, positions: [...c.positions, { ...pos, id: uuidv4() }] } : c));
            setPendingChanges(true);
            setShowAddPositionModal(false);
          }}
        />
      )}

      {/* Add Temp Staff Modal */}
      {showAddTempStaffModal && (
        <AddTempStaffModal 
          isOpen={showAddTempStaffModal}
          onClose={() => setShowAddTempStaffModal(false)}
          onAdd={(temp: any) => {
            setStaffList(prev => [...prev, { id: `temp_${uuidv4()}`, full_name: temp.name, is_temporary: true }]);
            setShowAddTempStaffModal(false);
            addToast("Temporary staff added", "success");
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2a57] rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Delete Position</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this position? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePosition} 
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
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
  getMatchingStaff,
  bulkMode = false,
  isSelected = false,
  onSelect = () => {}
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
  bulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
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
    } ${isAssigned ? 'shadow-lg' : 'hover:shadow-xl'} ${bulkMode && isSelected ? 'ring-2 ring-green-500' : ''}`}>
      {/* Bulk Selection Checkbox */}
      {bulkMode && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
        </div>
      )}
      
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
              <Image
                src={assignedStaff.photoUrl}
                alt={assignedStaff.full_name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover border-2 border-gray-300 shadow-md"
                unoptimized
              />
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
function AddPositionModal({ isOpen, onClose, categories, selectedCategory, onAdd }: any) {
  const [formData, setFormData] = useState({ callsign: '', position: '', categoryId: selectedCategory || categories[0]?.id, required: false });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2a57] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2d437a] flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Position</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(Number(formData.categoryId), formData); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <select 
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full rounded-lg border-gray-300 dark:border-[#2d437a] dark:bg-[#15192c] py-2"
            >
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Callsign</label>
              <input 
                autoFocus
                type="text" 
                required
                className="w-full rounded-lg border-gray-300 dark:border-[#2d437a] dark:bg-[#15192c] py-2 px-3"
                placeholder="e.g. A1"
                value={formData.callsign}
                onChange={e => setFormData({ ...formData, callsign: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
              <input 
                type="text" 
                required
                className="w-full rounded-lg border-gray-300 dark:border-[#2d437a] dark:bg-[#15192c] py-2 px-3"
                placeholder="e.g. Supervisor"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="req" 
              checked={formData.required}
              onChange={e => setFormData({ ...formData, required: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            <label htmlFor="req" className="text-sm text-gray-600 dark:text-gray-300">Critical Position (High Priority)</label>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-[#23408e] hover:bg-blue-800 text-white rounded-lg font-medium">Create</button>
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

// --- STAFF LIST VIEW ---
function StaffListView({ addToast }: { addToast: any }) {
  // Simplified for brevity - reuse similar logic from original code but with improved UI/UX
  return (
    <div className="p-8 text-center text-gray-500">
      <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
      <p>Full staff CRUD operations are available here.</p>
    </div>
  );
}
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

  const fetchUserCompany = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if ((profile as any)?.company_id) {
        setUserCompanyId((profile as any).company_id);
      } else {
        console.log("No company ID available, skipping staff fetch");
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  }, []);

  const fetchStaff = useCallback( async () => {
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

      const formattedStaff = data?.map((staff: any) => ({
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
  }, [userCompanyId]);

  useEffect(() => {
    fetchUserCompany();
  }, [fetchUserCompany]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
        const { error } = await (supabase as any)
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
        const { error } = await (supabase as any)
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

// Add Temporary Staff Modal Component
function AddTempStaffModal({ isOpen, onClose, onAdd }: any) {
  const [name, setName] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2a57] rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Add Temporary Staff</h3>
        <input 
          autoFocus
          className="w-full border rounded-lg px-3 py-2 mb-4 dark:bg-[#15192c] dark:border-[#2d437a]"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
          <button onClick={() => onAdd({ name })} disabled={!name} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
} 
