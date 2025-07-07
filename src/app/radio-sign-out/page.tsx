'use client';
import React, { useState } from 'react';

// Mock data for staff with assigned callsigns
const mockAssignments = [
  { id: 1, name: 'David Capener', callsign: 'A1', role: 'Head of Security' },
  { id: 2, name: 'Phil Noe', callsign: 'A2', role: 'Site Coordinator' },
  { id: 3, name: 'Luke Winterburne', callsign: 'S1', role: 'Pit Supervisor' },
];

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
  const [assignments, setAssignments] = useState(
    mockAssignments.map(staff => ({
      ...staff,
      radio: '',
      pitCan: '',
      earPiece: '',
      status: '', // Not Signed Out by default
      signOutTime: '',
      returnTime: '',
    }))
  );
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
  const handleRadioChange = (staffId: number, radioNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, radio: radioNumber };
    }));
  };

  const handlePitCanChange = (staffId: number, pitCanNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, pitCan: pitCanNumber };
    }));
  };

  const handleEarPieceChange = (staffId: number, earPieceNumber: string) => {
    setAssignments(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      return { ...staff, earPiece: earPieceNumber };
    }));
  };

  // Sign Out logic
  const handleSignOut = (staffId: number) => {
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
        return { ...r, assignedTo: staffId };
      }
      return r;
    }));
    setPitCans(prev => prev.map(p => {
      const staff = assignments.find(s => s.id === staffId);
      if (p.number === staff?.pitCan) {
        return { ...p, assignedTo: staffId };
      }
      return p;
    }));
    setEarPieces(prev => prev.map(e => {
      const staff = assignments.find(s => s.id === staffId);
      if (e.number === staff?.earPiece) {
        return { ...e, assignedTo: staffId };
      }
      return e;
    }));
  };

  // Sign In logic
  const handleSignIn = (staffId: number) => {
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
    <div className="flex flex-col h-full w-full max-w-none">
      <div className="flex-shrink-0 px-8 pt-8 pb-2">
        <h1 className="text-2xl font-bold mb-4">Radio Sign Out</h1>
        <div className="w-full flex flex-col gap-2 sm:flex-row sm:gap-4 mb-4">
          {/* Add Radios */}
          <div className="flex-1 min-w-[220px] bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center h-[64px]">
            <div className="flex items-center gap-2 px-3 py-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Radios:</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newRadioAmount}
                onChange={e => setNewRadioAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-14 px-2 py-1 rounded border border-gray-300 text-sm"
              />
              <button
                onClick={handleAddRadios}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm"
              >
                Add
              </button>
              <span className="ml-3 text-xs text-gray-500 whitespace-nowrap align-middle" style={{marginTop:2}}>Total: {radios.length} <span className="text-green-700 font-semibold">| Available: {radiosAvailable}</span></span>
            </div>
          </div>
          {/* Add Pit Cans */}
          <div className="flex-1 min-w-[220px] bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center h-[64px]">
            <div className="flex items-center gap-2 px-3 py-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Pit Cans:</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newPitCanAmount}
                onChange={e => setNewPitCanAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-14 px-2 py-1 rounded border border-gray-300 text-sm"
              />
              <button
                onClick={handleAddPitCans}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm"
              >
                Add
              </button>
              <span className="ml-3 text-xs text-gray-500 whitespace-nowrap align-middle" style={{marginTop:2}}>Total: {pitCans.length} <span className="text-green-700 font-semibold">| Available: {pitCansAvailable}</span></span>
            </div>
          </div>
          {/* Add Ear Pieces */}
          <div className="flex-1 min-w-[220px] bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center h-[64px]">
            <div className="flex items-center gap-2 px-3 py-2 w-full">
              <span className="font-medium whitespace-nowrap">Add Ear Pieces:</span>
              <input
                type="number"
                min={1}
                max={200}
                value={newEarPieceAmount}
                onChange={e => setNewEarPieceAmount(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-14 px-2 py-1 rounded border border-gray-300 text-sm"
              />
              <button
                onClick={handleAddEarPieces}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm"
              >
                Add
              </button>
              <span className="ml-3 text-xs text-gray-500 whitespace-nowrap align-middle" style={{marginTop:2}}>Total: {earPieces.length} <span className="text-green-700 font-semibold">| Available: {earPiecesAvailable}</span></span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Callsign/Role</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Radio Number</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Pit Can</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Ear Piece</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Sign Out Time</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Return Time</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                        className="rounded border border-gray-300 px-2 py-1"
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
                        className="rounded border border-gray-300 px-2 py-1"
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
                        className="rounded border border-gray-300 px-2 py-1"
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
                        className="rounded border border-gray-300 px-2 py-1 bg-gray-100 text-gray-700 w-32"
                        value={staff.signOutTime ? staff.signOutTime.replace('T', ' ') : ''}
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="rounded border border-gray-300 px-2 py-1 bg-gray-100 text-gray-700 w-32"
                        value={staff.returnTime ? staff.returnTime.replace('T', ' ') : ''}
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(!staff.status || staff.status === 'Returned') && (
                        <button
                          className="text-blue-600 hover:underline mr-2"
                          disabled={!staff.radio}
                          onClick={() => handleSignOut(staff.id)}
                        >
                          Sign Out
                        </button>
                      )}
                      {staff.status === 'Signed Out' && (
                        <button
                          className="text-green-600 hover:underline mr-2"
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