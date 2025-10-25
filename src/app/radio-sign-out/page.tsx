"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Assignment row type (built from Supabase data)
type AssignmentRow = {
  id: string; // unique row id
  profileId?: string | null;
  name: string;
  callsign: string;
  role: string;
  radio: string;
  pitCan: string;
  earPiece: string;
  status: string; // "Signed Out" | "Returned" | ""
  signOutTime: string;
  returnTime: string;
};

// Mock radio inventory
const initialRadios = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  number: `R${i + 1}`,
  assignedTo: null as number | null,
}));

const initialPitCans = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  number: `P${i + 1}`,
  assignedTo: null as number | null,
}));

const initialEarPieces = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  number: `E${i + 1}`,
  assignedTo: null as number | null,
}));

function getNowISO() {
  return new Date().toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
}

export default function RadioSignOutPage() {
  const [radios, setRadios] = useState(initialRadios);
  const [pitCans, setPitCans] = useState(initialPitCans);
  const [earPieces, setEarPieces] = useState(initialEarPieces);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  // Load current event and assigned staff for that event
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 1) Get current event
        const { data: event } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();
        if (!(event as any)?.id) {
          setEventId(null);
          setAssignments([]);
          setLoading(false);
          return;
        }
        setEventId((event as any).id);

        // 2) Fetch positions for event
        const { data: roles } = await supabase
          .from('callsign_positions')
          .select('id, callsign, position')
          .eq('event_id', (event as any).id);
        const roleById = new Map((roles || []).map((r: any) => [r.id, r]));

        // 3) Assignments for event
        const { data: assigns } = await supabase
          .from('callsign_assignments')
          .select('position_id, user_id, assigned_name')
          .eq('event_id', (event as any).id);

        const withAssignee = (assigns || []).filter((a: any) => a.user_id || a.assigned_name);

        // 4) Map profile IDs to names
        const profileIds = Array.from(new Set(withAssignee.map((a: any) => a.user_id).filter(Boolean))) as string[];
        let profilesMap = new Map<string, string>();
        if (profileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);
          profilesMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || '']));
        }

        // 5) Build assignment rows
        const rows: AssignmentRow[] = withAssignee
          .map(a => {
            const role = roleById.get((a as any).position_id);
            if (!role) return null;
            const name = (a as any).user_id ? (profilesMap.get((a as any).user_id) || '') : ((a as any).assigned_name || '');
            if (!name) return null; // skip if we cannot resolve a name
            return {
              id: `${(a as any).position_id}`,
              profileId: (a as any).user_id || null,
              name,
              callsign: role.callsign,
              role: role.position,
              radio: '',
              pitCan: '',
              earPiece: '',
              status: '',
              signOutTime: '',
              returnTime: '',
            } as AssignmentRow;
          })
          .filter(Boolean) as AssignmentRow[];

        setAssignments(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [newRadioAmount, setNewRadioAmount] = useState(1);
  const [newPitCanAmount, setNewPitCanAmount] = useState(1);
  const [newEarPieceAmount, setNewEarPieceAmount] = useState(1);

  // Add radios
  const handleAddRadios = () => {
    const nextId = radios.length > 0 ? Math.max(...radios.map(r => r.id)) + 1 : 1;
    const newRadios = Array.from({ length: newRadioAmount }, (_, i) => ({
      id: nextId + i,
      number: `R${nextId + i}`,
      assignedTo: null as number | null,
    }));
    setRadios([...radios, ...newRadios]);
    setNewRadioAmount(1);
  };

  // Add pit cans
  const handleAddPitCans = () => {
    const nextId = pitCans.length > 0 ? Math.max(...pitCans.map(p => p.id)) + 1 : 1;
    const newPitCans = Array.from({ length: newPitCanAmount }, (_, i) => ({
      id: nextId + i,
      number: `P${nextId + i}`,
      assignedTo: null as number | null,
    }));
    setPitCans([...pitCans, ...newPitCans]);
    setNewPitCanAmount(1);
  };

  // Add ear pieces
  const handleAddEarPieces = () => {
    const nextId = earPieces.length > 0 ? Math.max(...earPieces.map(e => e.id)) + 1 : 1;
    const newEarPieces = Array.from({ length: newEarPieceAmount }, (_, i) => ({
      id: nextId + i,
      number: `E${nextId + i}`,
      assignedTo: null as number | null,
    }));
    setEarPieces([...earPieces, ...newEarPieces]);
    setNewEarPieceAmount(1);
  };

  // Get available equipment
  const getAvailableRadios = () => radios.filter(r => r.assignedTo === null);
  const getAvailablePitCans = () => pitCans.filter(p => p.assignedTo === null);
  const getAvailableEarPieces = () => earPieces.filter(e => e.assignedTo === null);

  // Handle equipment assignment change
  const handleRadioChange = (staffId: string, radioNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, radio: radioNumber };
    }));
  };

  const handlePitCanChange = (staffId: string, pitCanNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, pitCan: pitCanNumber };
    }));
  };

  const handleEarPieceChange = (staffId: string, earPieceNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, earPiece: earPieceNumber };
    }));
  };

  // Sign Out logic
  const handleSignOut = (staffId: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      if (!staff.radio) return staff; // Must select a radio
      return {
        ...staff,
        status: 'Signed Out',
        signOutTime: getNowISO(),
        returnTime: '',
      };
    }));
    // Mark equipment as assigned
    setRadios(prev => prev.map(r => {
      const staff = assignments.find(s => s.id === staffId);
      if (r.number === staff?.radio) {
        return { ...r, assignedTo: null }; // Keep as null since we don't have numeric ID mapping
      }
      return r;
    }));
    setPitCans(prev => prev.map(p => {
      const staff = assignments.find(s => s.id === staffId);
      if (p.number === staff?.pitCan) {
        return { ...p, assignedTo: null }; // Keep as null since we don't have numeric ID mapping
      }
      return p;
    }));
    setEarPieces(prev => prev.map(e => {
      const staff = assignments.find(s => s.id === staffId);
      if (e.number === staff?.earPiece) {
        return { ...e, assignedTo: null }; // Keep as null since we don't have numeric ID mapping
      }
      return e;
    }));
  };

  // Sign In logic
  const handleSignIn = (staffId: string) => {
    const staff = assignments.find(s => s.id === staffId);
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return {
        ...staff,
        status: 'Returned',
        returnTime: getNowISO(),
        radio: '',
        pitCan: '',
        earPiece: '',
      };
    }));
    // Mark equipment as available
    setRadios(prev => prev.map(r => {
      if (r.number === staff?.radio) {
        return { ...r, assignedTo: null };
      }
      return r;
    }));
    setPitCans(prev => prev.map(p => {
      if (p.number === staff?.pitCan) {
        return { ...p, assignedTo: null };
      }
      return p;
    }));
    setEarPieces(prev => prev.map(e => {
      if (e.number === staff?.earPiece) {
        return { ...e, assignedTo: null };
      }
      return e;
    }));
  };

  // Status color
  const getStatusColor = (status: string, signOutTime: string, returnTime: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status === 'Returned') return 'bg-green-100 text-green-800';
    if (status === 'Signed Out') {
      if (signOutTime && !returnTime) {
        const out = new Date(signOutTime);
        const now = new Date();
        if ((now.getTime() - out.getTime()) / (1000 * 60 * 60) > 8) {
          return 'bg-red-100 text-red-800';
        }
      }
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Equipment available counters
  const radiosAvailable = getAvailableRadios().length;
  const pitCansAvailable = getAvailablePitCans().length;
  const earPiecesAvailable = getAvailableEarPieces().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Radio Sign Out</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Assign radios, pit cans and earpieces; track sign-outs and returns</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Loading current event assignments…</div>
        )}

        {/* Controls */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Add Radios */}
          <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 shadow-sm">
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Radios</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newRadioAmount}
                onChange={e => setNewRadioAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-16 px-2 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 dark:bg-[#182447] dark:border-[#2d437a] text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleAddRadios}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm shadow"
              >
                Add
              </button>
              <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">Total: {radios.length} · <span className="text-green-700 font-semibold">Available: {radiosAvailable}</span></span>
            </div>
          </div>
          {/* Add Pit Cans */}
          <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 shadow-sm">
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Pit Cans</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newPitCanAmount}
                onChange={e => setNewPitCanAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-16 px-2 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 dark:bg-[#182447] dark:border-[#2d437a] text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleAddPitCans}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm shadow"
              >
                Add
              </button>
              <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">Total: {pitCans.length} · <span className="text-green-700 font-semibold">Available: {pitCansAvailable}</span></span>
            </div>
          </div>
          {/* Add Ear Pieces */}
          <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] p-4 shadow-sm">
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Ear Pieces</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newEarPieceAmount}
                onChange={e => setNewEarPieceAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-16 px-2 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 dark:bg-[#182447] dark:border-[#2d437a] text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleAddEarPieces}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold text-sm shadow"
              >
                Add
              </button>
              <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">Total: {earPieces.length} · <span className="text-green-700 font-semibold">Available: {earPiecesAvailable}</span></span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a] text-sm">
            <thead className="bg-gray-50 dark:bg-[#2d437a] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Callsign/Role</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Radio Number</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Pit Can</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Ear Piece</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Sign Out Time</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Return Time</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2d437a]">
              {assignments.map(staff => {
                const availableRadios = getAvailableRadios().concat(
                  staff.radio && staff.status === 'Signed Out'
                    ? radios.filter(r => r.number === staff.radio)
                    : []
                );
                const availablePitCans = getAvailablePitCans().concat(
                  staff.pitCan && staff.status === 'Signed Out'
                    ? pitCans.filter(p => p.number === staff.pitCan)
                    : []
                );
                const availableEarPieces = getAvailableEarPieces().concat(
                  staff.earPiece && staff.status === 'Signed Out'
                    ? earPieces.filter(e => e.number === staff.earPiece)
                    : []
                );
                return (
                  <tr key={staff.id} className="align-middle">
                    <td className="px-3 py-2 whitespace-nowrap">{staff.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{staff.callsign} <span className="text-xs text-gray-400">{staff.role}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        className="rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-2 py-1"
                        value={staff.radio}
                        disabled={staff.status === 'Signed Out'}
                        onChange={e => handleRadioChange(staff.id, e.target.value)}
                      >
                        <option value="">Select</option>
                        {availableRadios.map(radio => (
                          <option key={radio.id} value={radio.number}>{radio.number}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        className="rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-2 py-1"
                        value={staff.pitCan}
                        disabled={staff.status === 'Signed Out'}
                        onChange={e => handlePitCanChange(staff.id, e.target.value)}
                      >
                        <option value="">Select</option>
                        {availablePitCans.map(pitCan => (
                          <option key={pitCan.id} value={pitCan.number}>{pitCan.number}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        className="rounded-lg border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] px-2 py-1"
                        value={staff.earPiece}
                        disabled={staff.status === 'Signed Out'}
                        onChange={e => handleEarPieceChange(staff.id, e.target.value)}
                      >
                        <option value="">Select</option>
                        {availableEarPieces.map(earPiece => (
                          <option key={earPiece.id} value={earPiece.number}>{earPiece.number}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap`}>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(staff.status, staff.signOutTime, staff.returnTime)}`}>
                        {staff.status === 'Signed Out' && staff.signOutTime && !staff.returnTime && getStatusColor(staff.status, staff.signOutTime, staff.returnTime).includes('red') ? 'Overdue' : staff.status || 'Not Signed Out'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="rounded-lg border border-gray-300 dark:border-[#2d437a] px-2 py-1 bg-gray-100 dark:bg-[#182447] text-gray-700 dark:text-gray-100 w-36"
                        value={staff.signOutTime ? staff.signOutTime.replace('T', ' ') : ''}
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="rounded-lg border border-gray-300 dark:border-[#2d437a] px-2 py-1 bg-gray-100 dark:bg-[#182447] text-gray-700 dark:text-gray-100 w-36"
                        value={staff.returnTime ? staff.returnTime.replace('T', ' ') : ''}
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(!staff.status || staff.status === 'Returned') && (
                        <button
                          className="text-blue-600 hover:underline mr-2 font-semibold"
                          disabled={!staff.radio}
                          onClick={() => handleSignOut(staff.id)}
                        >
                          Sign Out
                        </button>
                      )}
                      {staff.status === 'Signed Out' && (
                        <button
                          className="text-green-600 hover:underline mr-2 font-semibold"
                          onClick={() => handleSignIn(staff.id)}
                        >
                          Sign In
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 