"use client";
import React, { useState, useEffect } from "react";
import { UserGroupIcon, PlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

export default function StaffManagementPage() {
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    contact_number: "",
    email: "",
    skill_tags: [] as string[],
    notes: "",
    active: true
  });

  // SKILL_OPTIONS from callsign assignment page
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
    "First Aid",
    "Medical",
    "Traffic Management",
    "Access Control",
    "Search",
    "Crowd Management",
    "VIP Protection",
    "K9 Handler",
    "CCTV Operator",
    "Radio Operator",
    "Fire Marshal",
    "Health & Safety",
    "Risk Assessment",
    "Incident Management",
    "Emergency Response",
    "Evacuation",
    "Lockdown",
    "Bomb Threat",
    "Terrorism Awareness",
    "Conflict Resolution",
    "Customer Service",
    "Communication",
    "Leadership",
    "Team Management",
    "Training",
    "Mentoring",
    "Report Writing",
    "Investigation",
    "Evidence Handling",
    "Legal Compliance",
    "Health & Safety",
    "Manual Handling",
    "Working at Heights",
    "Confined Spaces",
    "Hot Work",
    "Electrical Safety",
    "Chemical Safety",
    "Noise",
    "Vibration",
    "Radiation",
    "Biological Hazards",
    "Psychological Safety",
    "Wellbeing",
    "Mental Health",
    "Stress Management",
    "Fatigue Management",
    "Substance Abuse",
    "Domestic Violence",
    "Safeguarding",
    "Child Protection",
    "Vulnerable Adults",
    "Equality & Diversity",
    "Inclusion",
    "Unconscious Bias",
    "Cultural Awareness",
    "Religious Awareness",
    "Disability Awareness",
    "LGBTQ+ Awareness",
    "Age Awareness",
    "Gender Awareness",
    "Neurodiversity",
    "Accessibility",
    "Reasonable Adjustments",
    "Inclusive Language",
    "Inclusive Design",
    "Inclusive Leadership",
    "Inclusive Culture",
    "Inclusive Recruitment",
    "Inclusive Training",
    "Inclusive Communication",
    "Inclusive Events",
    "Inclusive Venues",
    "Inclusive Services",
    "Inclusive Products",
    "Inclusive Technology",
    "Inclusive Digital",
    "Inclusive Marketing",
    "Inclusive Sales",
    "Inclusive Support",
    "Inclusive Feedback",
    "Inclusive Improvement",
    "Inclusive Innovation",
    "Inclusive Growth",
    "Inclusive Success",
    "Inclusive Future"
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchUserCompany() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id;
  }

  async function fetchStaff() {
    try {
      setLoading(true);
      const companyId = await fetchUserCompany();
      if (!companyId) return;

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      full_name: "",
      contact_number: "",
      email: "",
      skill_tags: [],
      notes: "",
      active: true
    });
    setShowAddModal(true);
  }

  function openEditModal(staffMember: any) {
    setFormData({
      full_name: staffMember.full_name || "",
      contact_number: staffMember.contact_number || "",
      email: staffMember.email || "",
      skill_tags: staffMember.skill_tags || [],
      notes: staffMember.notes || "",
      active: staffMember.active
    });
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  }

  async function handleSave() {
    try {
      const companyId = await fetchUserCompany();
      if (!companyId) return;

      const staffData = {
        ...formData,
        company_id: companyId,
        updated_at: new Date().toISOString()
      };

      if (selectedStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', selectedStaff.id);
        if (error) throw error;
      } else {
        // Add new staff
        const { error } = await supabase
          .from('staff')
          .insert([{ ...staffData, created_at: new Date().toISOString() }]);
        if (error) throw error;
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  }

  async function handleDelete(staffId: string) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);
      if (error) throw error;
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  }

  const openProfileModal = (member: any) => {
    setSelectedStaff(member);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStaff(null);
  };

  const filteredStaff = staff.filter(member =>
    member.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    member.email?.toLowerCase().includes(query.toLowerCase()) ||
    member.skill_tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Staff Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your team directory, availability and documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow"
            >
              <PlusIcon className="w-5 h-5" />
              Add Staff
            </button>
            <button className="inline-flex items-center gap-2 bg-white dark:bg-[#23408e] text-gray-700 dark:text-white border border-gray-200 dark:border-[#2d437a] py-2.5 px-4 rounded-lg shadow-sm hover:shadow">
              <ClipboardDocumentListIcon className="w-5 h-5" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Staff", value: staff.length },
            { label: "Active", value: staff.filter(s => s.active).length },
            { label: "Inactive", value: staff.filter(s => !s.active).length },
          ].map((kpi) => (
            <div key={kpi.label} className="relative bg-white dark:bg-[#23408e] text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
              <p className="text-sm text-gray-600 dark:text-blue-100">{kpi.label}</p>
              <p className="text-3xl font-extrabold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Search and filters */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, role, skill..."
                className="w-full rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <select className="rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-3 py-2">
                <option>All Roles</option>
                <option>Manager</option>
                <option>Supervisor</option>
                <option>Security</option>
              </select>
              <select className="rounded-lg border border-gray-200 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57] text-gray-900 dark:text-gray-100 px-3 py-2">
                <option>Status: All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory table */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-4 sm:p-6 overflow-x-auto hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Name</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Role</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Contact</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Email</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Active</th>
                <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-gray-900 dark:text-gray-100" colSpan={6}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-gray-500 dark:text-blue-100">Loading staff...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-gray-900 dark:text-gray-100" colSpan={6}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <UserGroupIcon className="w-10 h-10 text-blue-600 mb-2" />
                      <p className="text-gray-500 dark:text-blue-100">
                        {query ? 'No staff found matching your search.' : 'No staff yet.'}
                      </p>
                      {!query && (
                        <button 
                          onClick={openAddModal}
                          className="mt-3 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
                        >
                          <PlusIcon className="w-5 h-5" />
                          Add your first staff member
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="border-t border-gray-100 dark:border-[#2d437a] hover:bg-gray-50 dark:hover:bg-[#2d437a]/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {member.full_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {member.skill_tags?.slice(0, 2).join(', ') || 'No role assigned'}
                      {member.skill_tags?.length > 2 && '...'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {member.contact_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {member.email || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openProfileModal(member)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                          title="View Profile"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Staff Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-[#2d437a]">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills/Roles
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-[#2d437a] rounded-lg p-2 bg-white dark:bg-[#182447]">
                    {SKILL_OPTIONS.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-[#2d437a] rounded">
                        <input
                          type="checkbox"
                          checked={formData.skill_tags.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                skill_tags: [...formData.skill_tags, skill]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                skill_tags: formData.skill_tags.filter(tag => tag !== skill)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this staff member"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Staff Member
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-[#2d437a] flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedStaff(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2d437a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d548a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedStaff ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-[#2d437a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Staff Profile
                  </h2>
                  <button
                    onClick={closeProfileModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedStaff.full_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedStaff.contact_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedStaff.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skills/Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaff.skill_tags?.length > 0 ? (
                      selectedStaff.skill_tags.map((skill: string) => (
                        <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No skills assigned</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedStaff.notes || 'No notes'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedStaff.active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {selectedStaff.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-[#2d437a] flex justify-end space-x-3">
                <button
                  onClick={() => openEditModal(selectedStaff)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={closeProfileModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2d437a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d548a] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 