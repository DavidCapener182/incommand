"use client";
import React from "react";
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useMemo } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Staff {
  id: string;
  full_name: string;
  contact_number?: string;
  email?: string;
  skill_tags?: string[];
  notes?: string;
  active?: boolean;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"full_name" | "active" | "skill_tags">("full_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function fetchStaff() {
      setLoading(true);
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name, contact_number, email, skill_tags, notes, active");
      if (!error && data) setStaff(data);
      setLoading(false);
    }
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    let filtered = staff;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((st) =>
        st.full_name?.toLowerCase().includes(s) ||
        st.email?.toLowerCase().includes(s) ||
        st.contact_number?.toLowerCase().includes(s) ||
        (st.skill_tags && st.skill_tags.some((tag) => tag.toLowerCase().includes(s))) ||
        (typeof st.active === "boolean" && (s === "active" ? st.active : s === "inactive" ? !st.active : false))
      );
    }
    // Sorting
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      if (sortBy === "skill_tags") {
        aVal = aVal ? aVal.join(", ") : "";
        bVal = bVal ? bVal.join(", ") : "";
      }
      if (sortBy === "active") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [staff, search, sortBy, sortDir]);

  function handleSort(col: "full_name" | "active" | "skill_tags") {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#15192c] p-6 md:p-8 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-blue-700 dark:text-blue-300" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors duration-200">
          <PlusIcon className="h-5 w-5" />
          Add Staff
        </button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name, skill, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-6 w-full overflow-x-auto transition-colors duration-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold cursor-pointer" onClick={() => handleSort("full_name")}>Name {sortBy === "full_name" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Contact</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Email</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold cursor-pointer" onClick={() => handleSort("skill_tags")}>Skills {sortBy === "skill_tags" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Notes</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold cursor-pointer" onClick={() => handleSort("active")}>Active {sortBy === "active" && (sortDir === "asc" ? "▲" : "▼")}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-blue-200 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100" colSpan={7}>
                  <div className="text-center text-gray-400 dark:text-gray-300 py-8">Loading staff...</div>
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100" colSpan={7}>
                  <div className="text-center text-gray-400 dark:text-gray-300 py-8">No staff found.</div>
                </td>
              </tr>
            ) : (
              filteredStaff.map((st) => (
                <tr key={st.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{st.full_name}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{st.contact_number || "-"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{st.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {st.skill_tags && st.skill_tags.length > 0 ? st.skill_tags.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{st.notes || "-"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{typeof st.active === "boolean" ? (st.active ? "Active" : "Inactive") : "-"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">-</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 