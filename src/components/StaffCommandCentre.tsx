'use client'

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UserGroupIcon, KeyIcon, DevicePhoneMobileIcon, CalendarDaysIcon, IdentificationIcon, PlusIcon, MapPinIcon, SignalIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

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

// Staff List Component with Supabase integration
const StaffList = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const fetchStaff = useCallback(async () => {
    if (!userCompanyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('company_id', userCompanyId)
        .order('full_name');
      
      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [userCompanyId]);

  useEffect(() => {
    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (userCompanyId) {
      fetchStaff();
    }
  }, [userCompanyId, fetchStaff]);

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
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading staff...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
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
};
const RadioSignOut = () => (
  <div className="p-8 text-gray-900 dark:text-gray-100">Radio Sign Out view coming soon...</div>
);

const navItems = [
  { name: 'Staff Management', icon: UserGroupIcon, key: 'staff' },
  { name: 'Callsign Assignment', icon: KeyIcon, key: 'callsign' },
  { name: 'Radio Sign Out', icon: DevicePhoneMobileIcon, key: 'radio' },
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
  "CCTV Operator",
  "Door Supervisor",
  "Event Security",
  "Crowd Management",
  "First Aid",
  "Fire Marshal",
  "Radio Operator",
  "Traffic Management",
  "Medical",
  "Production",
  "Venue Staff",
  "Volunteer",
];

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

  // Real-time staff location tracking
  const { user } = useAuth();
  const [staffLocations, setStaffLocations] = useState<Record<string, any>>({});
  const [locationChannel, setLocationChannel] = useState<any>(null);
  const [isLocationConnected, setIsLocationConnected] = useState(false);
  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);

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
        .from("callsign_positions")
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
          if (r.area) {
            if (!areaMap[r.area]) areaMap[r.area] = [];
            areaMap[r.area].push({
              id: r.id,
              callsign: r.callsign,
              short: r.short_code,
              position: r.position,
            });
          }
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
          if (a.callsign_role_id && a.assigned_name) {
            assignMap[a.callsign_role_id] = a.assigned_name;
          }
        });
        setAssignments(assignMap);
      } else {
        setAssignments({});
      }
      setSaveStatus(null);
    };
    loadRolesAndAssignments();
  }, [eventId]);

  // Load previous names for autocomplete
  useEffect(() => {
    if (!eventId) return;
    const fetchPreviousNames = async () => {
      const { data, error } = await supabase
        .from("callsign_assignments")
        .select("assigned_name")
        .eq("event_id", eventId)
        .not("assigned_name", "is", null);
      if (!error && data) {
        const names = Array.from(new Set(data.map((r) => r.assigned_name).filter(name => name !== null)));
        setAllPreviousNames(names);
        // Group by first letter for better organization
        const grouped: Record<string, string[]> = {};
        names.forEach((name) => {
          const firstLetter = name.charAt(0).toUpperCase();
          if (!grouped[firstLetter]) grouped[firstLetter] = [];
          grouped[firstLetter].push(name);
        });
        setPreviousNames(grouped);
      }
    };
    fetchPreviousNames();
  }, [eventId]);

  // Load all previous names across all events for global autocomplete
  useEffect(() => {
    const fetchAllNames = async () => {
      const { data, error } = await supabase
        .from("callsign_assignments")
        .select("assigned_name")
        .not("assigned_name", "is", null);
      if (!error && data) {
        const names = Array.from(new Set(data.map((r) => r.assigned_name).filter(name => name !== null)));
        setAllPreviousNames(names);
      }
    };
    fetchAllNames();
  }, []);

  // Initialize real-time staff location tracking
  useEffect(() => {
    if (!user || !eventId) return;

    const channel = supabase.channel(`staff-locations-${eventId}`, {
      config: {
        presence: {
          key: user.id,
        },
        broadcast: {
          self: true,
        },
      },
    }) as any;

    // Track staff locations
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const locations: Record<string, any> = {};
        let activeCount = 0;

        Object.values(presenceState).flat().forEach((presence: any) => {
          if (presence.location) {
            locations[presence.user_id] = {
              ...presence,
              lastUpdate: new Date()
            };
            activeCount++;
          }
        });

        setStaffLocations(locations);
        setActiveStaffCount(activeCount);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
        console.log('Staff member joined location tracking:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
        console.log('Staff member left location tracking:', key, leftPresences);
      })
      .on('broadcast', { event: 'location-update' }, ({ payload, user_id }: { payload: any; user_id: string }) => {
        if (user_id === user.id) return;
        
        setStaffLocations(prev => ({
          ...prev,
          [user_id]: {
            ...payload,
            lastUpdate: new Date()
          }
        }));
      })
      .subscribe(async (status: string) => {
        setIsLocationConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'Unknown User',
            location: null,
            lastUpdate: new Date()
          });
        }
      });

    setLocationChannel(channel);

    // Start location updates if geolocation is available
    if ('geolocation' in navigator) {
      locationUpdateInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            // Update local presence
            channel.track({
              user_id: user.id,
              name: user.user_metadata?.full_name || user.email || 'Unknown User',
              location,
              lastUpdate: new Date()
            });

            // Broadcast location update
            channel.send({
              type: 'broadcast',
              event: 'location-update',
              payload: location
            });
          },
          (error) => {
            console.log('Location error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }
      channel.unsubscribe();
    };
  }, [user, eventId]);

  const handleAssign = (posId: string) => {
    if (currentName.trim()) {
      setAssignments(prev => ({ ...prev, [posId]: currentName.trim() }));
      setCurrentName("");
    }
  };

  const handleEditClick = (groupName: string, positions: any[]) => {
    setEditGroup(groupName);
    setEditPositions([...positions]);
  };

  const handleEditChange = (idx: number, field: string, value: string) => {
    const newPositions = [...editPositions];
    newPositions[idx] = { ...newPositions[idx], [field]: value };
    setEditPositions(newPositions);
  };

  const handleRemoveRole = (idx: number) => {
    setEditPositions(editPositions.filter((_, i) => i !== idx));
  };

  const handleAddRole = () => {
    setEditPositions([...editPositions, { id: getNewId(), callsign: "", short: "", position: "" }]);
  };

  const handleSaveEdit = () => {
    if (editGroup) {
      setGroups(prev => prev.map(g => g.group === editGroup ? { ...g, positions: editPositions } : g));
      setEditGroup(null);
      setEditPositions([]);
    }
  };

  const handleSaveAll = async () => {
    if (!eventId) {
      setSaveStatus("No event selected");
      return;
    }
    setSaving(true);
    setSaveStatus("Saving...");
    try {
      // Clear existing roles and assignments for this event
      await supabase.from("callsign_assignments").delete().eq("event_id", eventId);
      await supabase.from("callsign_positions").delete().eq("event_id", eventId);

      // Insert new roles
      const rolesToInsert = groups.flatMap(g => g.positions.map(p => ({
        id: p.id,
        event_id: eventId,
        area: g.group,
        callsign: p.callsign,
        short_code: p.short,
        position: p.position,
      })));

        const { error: rolesError } = await supabase.from("callsign_positions").insert(rolesToInsert);
      if (rolesError) throw rolesError;

      // Insert assignments
      const assignmentsToInsert = Object.entries(assignments).map(([roleId, name]) => ({
        event_id: eventId,
        callsign_role_id: roleId,
        assigned_name: name,
      }));

      if (assignmentsToInsert.length > 0) {
        const { error: assignmentsError } = await supabase.from("callsign_assignments").insert(assignmentsToInsert);
        if (assignmentsError) throw assignmentsError;
      }

      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error: any) {
      setSaveStatus("Error saving: " + (error.message || error.toString()));
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (pos: any) => {
    const assigned = assignments[pos.id];
    if (assigned) return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300";
    return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300";
  };

  const renderView = () => {
    switch (activeView) {
      case 'staff':
        return <StaffList />;
      case 'callsign':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Callsign Assignment</h2>
              <p className="text-gray-600 dark:text-gray-400">Assign staff to callsigns for {eventName}</p>
            </div>

            {eventError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-700">
                <p className="text-red-800 dark:text-red-300">{eventError}</p>
              </div>
            )}

            {eventLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading event...</span>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Enter staff name..."
                      value={currentName}
                      onChange={(e) => setCurrentName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      list="previous-names"
                    />
                    <datalist id="previous-names">
                      {allPreviousNames.map((name, idx) => (
                        <option key={idx} value={name} />
                      ))}
                    </datalist>
                    <button
                      onClick={() => setCurrentName("")}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Live Staff Locations */}
                {Object.keys(staffLocations).length > 0 && (
                  <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <MapPinIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Staff Locations</h3>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(staffLocations).map(([userId, locationData]: [string, any]) => (
                        <motion.div
                          key={userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {locationData.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {locationData.location ? 
                                  `${locationData.location.latitude.toFixed(4)}, ${locationData.location.longitude.toFixed(4)}` :
                                  'Location unavailable'
                                }
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <SignalIcon className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-gray-500">
                                {locationData.location ? 
                                  `${Math.round(locationData.location.accuracy)}m` :
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <div key={group.group} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.group}</h3>
                          <button
                            onClick={() => handleEditClick(group.group, group.positions)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {group.positions.map((pos) => (
                          <div
                            key={pos.id}
                            className={`p-3 border rounded-lg ${getStatusColor(pos)} transition-colors`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{pos.callsign}</div>
                                <div className="text-sm opacity-75">{pos.position}</div>
                              </div>
                              <div className="text-right">
                                {assignments[pos.id] ? (
                                  <div className="text-sm font-medium">{assignments[pos.id]}</div>
                                ) : (
                                  <button
                                    onClick={() => handleAssign(pos.id)}
                                    disabled={!currentName.trim()}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Assign
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Button
                    onClick={handleSaveAll}
                    disabled={saving}
                    variant="primary"
                    size="md"
                  >
                    {saving ? "Saving..." : "Save All Assignments"}
                  </Button>
                  {saveStatus && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{saveStatus}</span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 'radio':
        return <RadioSignOut />;
      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Staff Command Centre</h1>
              {/* Real-time status indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isLocationConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isLocationConnected ? `${activeStaffCount} active` : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === item.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {renderView()}
      </div>
    </div>
  );
}
