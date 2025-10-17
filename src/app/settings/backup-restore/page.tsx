'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  ServerIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { useRole } from '../../../hooks/useRole';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Backup {
  id: string;
  name: string;
  description?: string;
  size: number;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'partial';
  tables: string[];
  userId: string;
}

interface RestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function BackupRestorePage() {
  const role = useRole();
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    type: 'full' as 'full' | 'partial',
    tables: [] as string[]
  });
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'overwrite' | 'rename'>('skip');

  useEffect(() => {
    if (user) {
      loadBackups();
      loadRestoreJobs();
      loadAvailableTables();
    }
  }, [user]);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const loadRestoreJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('restore_jobs')
        .select('*')
        .order('startedAt', { ascending: false });

      if (error) throw error;
      setRestoreJobs(data || []);
    } catch (error) {
      console.error('Error loading restore jobs:', error);
    }
  };

  const loadAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (error) throw error;
      setAvailableTables(data?.map(t => t.table_name) || []);
    } catch (error) {
      console.error('Error loading available tables:', error);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupForm.name) return;

    setIsCreatingBackup(true);
    try {
      const backupData = {
        name: backupForm.name,
        description: backupForm.description,
        type: backupForm.type,
        tables: backupForm.type === 'partial' ? backupForm.tables : [],
        userId: user?.id,
        status: 'in_progress'
      };

      const { data, error } = await supabase
        .from('backups')
        .insert([backupData])
        .select()
        .single();

      if (error) throw error;

      // Mark as queued. A server-side job should process this backup.
      await updateBackupStatus(data.id, 'in_progress');
      setBackupForm({
        name: '',
        description: '',
        type: 'full',
        tables: []
      });
      setIsCreatingBackup(false);
      loadBackups();

    } catch (error) {
      console.error('Error creating backup:', error);
      setIsCreatingBackup(false);
    }
  };

  const updateBackupStatus = async (backupId: string, status: Backup['status']) => {
    try {
      const { error } = await supabase
        .from('backups')
        .update({ status })
        .eq('id', backupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating backup status:', error);
    }
  };

  const handleRestoreBackup = async (backup: Backup) => {
    if (!backup) return;

    setIsRestoring(true);
    setSelectedBackup(backup);

    try {
      const restoreJobData = {
        backupId: backup.id,
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString(),
        userId: user?.id
      };

      const { data, error } = await supabase
        .from('restore_jobs')
        .insert([restoreJobData])
        .select()
        .single();

      if (error) throw error;

      // Leave processing to background workers. UI will reflect updates from DB polling.
      setIsRestoring(false);
      setSelectedBackup(null);
      loadRestoreJobs();

    } catch (error) {
      console.error('Error starting restore:', error);
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  const updateRestoreProgress = async (jobId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('restore_jobs')
        .update({ progress })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating restore progress:', error);
    }
  };

  const updateRestoreStatus = async (jobId: string, status: RestoreJob['status']) => {
    try {
      const { error } = await supabase
        .from('restore_jobs')
        .update({ 
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating restore status:', error);
    }
  };

  const handleDownloadBackup = async (backup: Backup) => {
    try {
      // In a real implementation, this would generate and download the backup file
      const backupData = {
        ...backup,
        data: 'backup_data_here' // This would contain the actual backup data
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name}_${new Date(backup.createdAt).toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      setBackups(prev => prev.filter(b => b.id !== backupId));
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!user || !(role === 'admin' || role === 'superadmin')) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
        This page enqueues backup and restore jobs. Processing is handled by server-side workers. If you are running locally, these actions will create records but may not execute without a configured worker.
      </div>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="-mt-2">
        <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <a href="/settings" className="hover:underline">Settings</a>
          </li>
          <li>/</li>
          <li className="text-gray-700 dark:text-gray-200 font-medium">Backup & Restore</li>
        </ol>
      </nav>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Backup & Restore</h1>
          <p className="text-gray-600 dark:text-gray-300">Create backups, restore data, and manage backup history</p>
        </div>
        <button 
          onClick={() => setBackupForm({ name: '', description: '', type: 'full', tables: [] })} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <ServerIcon className="w-4 h-4" />
          Create Backup
        </button>
      </div>

      {/* Create Backup Form */}
      {backupForm.name === '' && (
        <div className="card-time p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200">Create New Backup</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="backupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup Name
                </label>
                <input
                  id="backupName"
                  type="text"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter backup name"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="backupType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup Type
                </label>
                <select
                  id="backupType"
                  value={backupForm.type}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, type: e.target.value as 'full' | 'partial' }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="full">Full Backup</option>
                  <option value="partial">Partial Backup</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="backupDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <input
                id="backupDescription"
                type="text"
                value={backupForm.description}
                onChange={(e) => setBackupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter backup description"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {backupForm.type === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Tables
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {availableTables.map((table) => (
                    <div key={table} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={table}
                        checked={backupForm.tables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBackupForm(prev => ({
                              ...prev,
                              tables: [...prev.tables, table]
                            }));
                          } else {
                            setBackupForm(prev => ({
                              ...prev,
                              tables: prev.tables.filter(t => t !== table)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={table} className="text-sm text-gray-700 dark:text-gray-300">{table}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup || !backupForm.name}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingBackup ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ServerIcon className="w-4 h-4" />
                    Create Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup History */}
      <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
            <ServerIcon className="w-5 h-5" />
            Backup History ({backups.length})
          </h2>
        </div>
        <div className="space-y-4">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{backup.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      backup.type === 'full' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {backup.type}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(backup.status)}
                      <span className="text-sm capitalize">{backup.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {backup.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{backup.description}</p>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Size: {formatFileSize(backup.size)}</p>
                    <p>Created: {new Date(backup.createdAt).toLocaleString()}</p>
                    {backup.type === 'partial' && backup.tables.length > 0 && (
                      <p>Tables: {backup.tables.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadBackup(backup)}
                    disabled={backup.status !== 'completed'}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRestoreBackup(backup)}
                    disabled={backup.status !== 'completed' || isRestoring}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No backups found. Create your first backup to get started.
            </div>
          )}
        </div>
      </div>

      {/* Restore Jobs */}
      {restoreJobs.length > 0 && (
        <div className="card-time p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
              <ArrowUpTrayIcon className="w-5 h-5" />
              Restore Jobs ({restoreJobs.length})
            </h2>
          </div>
          <div className="space-y-4">
            {restoreJobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 dark:border-[#2d437a] rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        <span className="text-sm capitalize">{job.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Started: {new Date(job.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {job.status === 'in_progress' && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.progress}% complete</p>
                      </div>
                    )}
                    {job.completedAt && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Completed: {new Date(job.completedAt).toLocaleString()}
                      </p>
                    )}
                    {job.errorMessage && (
                      <p className="text-sm text-red-500 dark:text-red-400">
                        Error: {job.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Resolution Settings */}
      <div className="bg-white dark:bg-[#23408e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#2d437a]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-blue-200 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Conflict Resolution
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Conflict Resolution Strategy
            </label>
            <select
              value={conflictResolution}
              onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'overwrite' | 'rename')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="skip">Skip conflicting records</option>
              <option value="overwrite">Overwrite existing records</option>
              <option value="rename">Rename conflicting records</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Skip:</strong> Keep existing data, skip imported records that conflict</p>
            <p><strong>Overwrite:</strong> Replace existing data with imported records</p>
            <p><strong>Rename:</strong> Add suffix to imported records to avoid conflicts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
