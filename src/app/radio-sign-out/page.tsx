"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RadioSignOut {
  id: number;
  radio_number: string;
  user_id: string;
  event_id: string | null;
  signed_out_at: string | null;
  signed_out_signature: string | null;
  signed_out_notes: string | null;
  signed_in_at: string | null;
  signed_in_signature: string | null;
  signed_in_notes: string | null;
  condition_on_return: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  overdue_notified_at: string | null;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    callsign?: string;
  };
}

export default function RadioSignOutPage() {
  const { user } = useAuth();
  const [signOuts, setSignOuts] = useState<RadioSignOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedSignOut, setSelectedSignOut] = useState<RadioSignOut | null>(null);
  const [signInNotes, setSignInNotes] = useState('');
  const [conditionOnReturn, setConditionOnReturn] = useState<string>('good');

  const fetchSignOuts = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching signouts for event:', eventId);
      
      // Direct database query instead of API
      const { data: signOutsData, error: signOutsError } = await supabase
        .from('radio_signouts')
        .select('*')
        .eq('event_id', eventId)
        .order('signed_out_at', { ascending: false });

      if (signOutsError) {
        console.error('Error fetching signouts:', signOutsError);
        throw new Error('Failed to fetch radio sign-outs');
      }

      console.log('Fetched signouts:', signOutsData);
      
      // Fetch profile data for each signout
      if (signOutsData && signOutsData.length > 0) {
        const userIds = [...new Set(signOutsData.map(s => s.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        // Merge profile data with signouts
        const signOutsWithProfiles = signOutsData.map(signOut => ({
          ...signOut,
          profile: profilesData?.find(p => p.id === signOut.user_id)
        }));
        
        setSignOuts(signOutsWithProfiles);
      } else {
        setSignOuts([]);
      }
    } catch (err) {
      console.error('Error in fetchSignOuts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const loadCurrentEvent = async () => {
      try {
        console.log('Loading current event...');
        const { data: event } = await supabase
          .from('events')
          .select('id')
          .eq('is_current', true)
          .single();
        
        console.log('Current event:', event);
        if (event?.id) {
          setEventId(event.id);
        }
      } catch (err) {
        console.error('Failed to load current event:', err);
      }
    };
    
    loadCurrentEvent();
  }, []);

  useEffect(() => {
    if (eventId) {
      console.log('Event ID set, fetching signouts...');
      fetchSignOuts();
    }
  }, [eventId, fetchSignOuts]);

  const handleSignIn = async (signOut: RadioSignOut) => {
    console.log('Signing in radio:', signOut);
    setSelectedSignOut(signOut);
    setShowSignInModal(true);
  };

  const confirmSignIn = async () => {
    if (!selectedSignOut) return;

    try {
      console.log('Confirming sign in for:', selectedSignOut.id);
      
      // Direct database update instead of API
      const { error } = await supabase
        .from('radio_signouts')
        .update({
          signed_in_at: new Date().toISOString(),
          signed_in_signature: 'Digital signature placeholder',
          signed_in_notes: signInNotes,
          condition_on_return: conditionOnReturn,
          status: 'in'
        })
        .eq('id', selectedSignOut.id);

      if (error) {
        console.error('Error signing in radio:', error);
        throw new Error('Failed to sign in radio');
      }

      console.log('Successfully signed in radio');
      
      // Refresh the data
      await fetchSignOuts();
      setShowSignInModal(false);
      setSelectedSignOut(null);
      setSignInNotes('');
      setConditionOnReturn('good');
    } catch (err) {
      console.error('Error in confirmSignIn:', err);
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  const getStatusColor = (status: string | null, signedOutAt: string | null, signedInAt: string | null) => {
    if (status === 'in' || signedInAt) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    }
    if (status === 'out' && signedOutAt) {
      const outTime = new Date(signedOutAt);
      const now = new Date();
      const hoursOut = (now.getTime() - outTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursOut > 8) {
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      }
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not signed in';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Radio Sign-outs
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchSignOuts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-6 w-1.5 rounded bg-gradient-to-b from-blue-600 to-indigo-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Radio Sign-Out System
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Track radio equipment assignments and returns
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Debug:</strong> Event ID: {eventId || 'Not found'} | Sign-outs: {signOuts.length}
          </p>
        </div>

        {/* Radio Sign-outs Table */}
        <div className="bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Radio Sign-outs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track all radio assignments and returns
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a]">
              <thead className="bg-gray-50 dark:bg-[#2d437a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Radio Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sign Out Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sign In Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                {signOuts.map((signOut) => (
                  <tr key={signOut.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Radio {signOut.radio_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {signOut.profile?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {signOut.profile?.full_name || 'Unknown Staff'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {signOut.profile?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(signOut.signed_out_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(signOut.signed_in_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(signOut.status, signOut.signed_out_at, signOut.signed_in_at)}`}>
                        {signOut.status === 'in' || signOut.signed_in_at ? '✅ Returned' : '⏰ Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {signOut.status === 'out' && !signOut.signed_in_at && (
                        <button
                          onClick={() => handleSignIn(signOut)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-semibold bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                        >
                          Sign In
                        </button>
                      )}
                      {(signOut.status === 'in' || signOut.signed_in_at) && (
                        <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {signOuts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">📻</div>
              <p>No radio sign-outs found</p>
            </div>
          )}
        </div>

        {/* Radio Log Table */}
        <div className="mt-10 bg-white dark:bg-[#23408e] rounded-2xl border border-gray-200 dark:border-[#2d437a] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d437a]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Radio Log
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track all sign-out and sign-in times
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2d437a]">
              <thead className="bg-gray-50 dark:bg-[#2d437a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Radio Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Signed Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Signed In
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-[#2d437a]">
                {signOuts.map((radio) => (
                  <tr key={radio.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Radio {radio.radio_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {radio.profile?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDateTime(radio.signed_out_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {radio.signed_in_at ? formatDateTime(radio.signed_in_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {signOuts.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No radio logs yet.
            </div>
          )}
        </div>

        {/* Sign In Modal */}
        {showSignInModal && selectedSignOut && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sign In Radio {selectedSignOut.radio_number}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Staff Member
                  </label>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {selectedSignOut.profile?.full_name || 'Unknown Staff'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sign In Notes
                  </label>
                  <textarea
                    value={signInNotes}
                    onChange={(e) => setSignInNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Any notes about the radio condition or return..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition on Return
                  </label>
                  <select
                    value={conditionOnReturn}
                    onChange={(e) => setConditionOnReturn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSignInModal(false);
                    setSelectedSignOut(null);
                    setSignInNotes('');
                    setConditionOnReturn('good');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSignIn}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign In Radio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}