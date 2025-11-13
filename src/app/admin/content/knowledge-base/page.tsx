'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import { 
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface KnowledgeBaseItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  source?: string;
  uploader_id?: string;
  status: 'draft' | 'published' | 'archived' | 'pending' | 'ingesting' | 'ingested' | 'failed';
  tags: string[];
  updated_at: string;
  published_at?: string;
  bytes?: number;
  error?: string;
}

interface SearchResult {
  knowledgeId: string;
  title: string;
  content: string;
  score: number;
  metadata: any;
  source?: string;
}

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<{ name: string; size: number; estimatedTime: number } | null>(null);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textUploading, setTextUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [clearingFailed, setClearingFailed] = useState(false);
  const [ingestingIds, setIngestingIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const addUploadLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setUploadLogs(prev => [`${timestamp} – ${message}`, ...prev].slice(0, 8));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      router.replace('/login');
      return;
    }
    if (role !== 'superadmin') {
      setLoading(false);
      router.replace('/admin');
      return;
    }

    loadItems();
    
    // Poll for ingestion status updates more frequently when items are ingesting
    const interval = setInterval(() => {
      const hasIngesting = items.some(item => item.status === 'ingesting');
      if (hasIngesting || uploading) {
        loadItems();
      }
    }, 2000); // Poll every 2 seconds for better feedback

    return () => clearInterval(interval);
  }, [authLoading, user, role, router, items, uploading]);

  async function loadItems() {
      try {
        const res = await fetch('/api/admin/content/knowledge-base');
        if (res.ok) {
          const data = await res.json();
        setItems(data.articles ?? []);
        }
      } catch (error) {
      console.error('Failed to fetch knowledge base items:', error);
      } finally {
        setLoading(false);
      }
    }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress('');

    for (const file of Array.from(files)) {
      try {
        addUploadLog(`Uploading file: ${file.name}`);
        // Calculate file size and estimated processing time
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const fileSizeKB = (file.size / 1024).toFixed(0);
        const fileSizeDisplay = file.size > 1024 * 1024 
          ? `${fileSizeMB} MB` 
          : `${fileSizeKB} KB`;
        
        // Estimate processing time based on file size
        // Rough estimates: ~10-30s per MB for small files, ~30-60s per MB for larger files
        // Plus base overhead of ~10-20 seconds
        const baseTime = 15; // seconds
        const timePerMB = file.size > 5 * 1024 * 1024 ? 45 : 20; // Slower for larger files
        const estimatedSeconds = Math.ceil(baseTime + (file.size / (1024 * 1024)) * timePerMB);
        const estimatedMinutes = Math.floor(estimatedSeconds / 60);
        const estimatedSecondsRemainder = estimatedSeconds % 60;
        const estimatedTimeDisplay = estimatedMinutes > 0
          ? `~${estimatedMinutes}m ${estimatedSecondsRemainder}s`
          : `~${estimatedSeconds}s`;
        
        // Store upload info for progress tracking
        setUploadingFile({
          name: file.name,
          size: file.size,
          estimatedTime: estimatedSeconds
        });
        setUploadStartTime(Date.now());
        setUploadProgress(`Uploading ${file.name} (${fileSizeDisplay}) - Estimated: ${estimatedTimeDisplay}...`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('tags', '');

        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

        try {
          const res = await fetch('/api/knowledge/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Upload failed');
          }

          const result = await res.json();
          const elapsed = uploadStartTime ? Math.round((Date.now() - uploadStartTime) / 1000) : 0;
          setUploadProgress(`✓ Uploaded ${file.name} (${fileSizeDisplay}) in ${elapsed}s. Click ingest to process.`);
          addUploadLog(`Uploaded ${file.name} (${result.bytes ? formatFileSize(result.bytes) : fileSizeDisplay}). Status pending.`);
          
          // Reload items immediately so it appears in the list
          loadItems();
          
          // Clear upload tracking
          setTimeout(() => {
            setUploadingFile(null);
            setUploadStartTime(null);
          }, 3000);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Upload timed out after 5 minutes. Large documents may take longer to process. Please try again or check the documents list for processing status.');
          }
          throw fetchError;
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        alert('Failed to upload file: ' + error.message);
        addUploadLog(`Failed to upload ${file.name}: ${error.message}`);
        // Don't stop the loop - continue with other files
      } finally {
        clearTimeout(timeoutId);
      }
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress('');
      setUploadingFile(null);
      setUploadStartTime(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 5000); // Increased delay to show success message and allow status update
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 10 })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleClearFailed = async () => {
    if (!confirm('Are you sure you want to delete all failed uploads? This action cannot be undone.')) {
      return;
    }

    setClearingFailed(true);
    try {
      const res = await fetch('/api/admin/content/knowledge-base?clearFailed=true', {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || `Successfully cleared ${data.deleted} failed upload${data.deleted !== 1 ? 's' : ''}`);
        loadItems(); // Reload the list
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to clear failed uploads');
      }
    } catch (error: any) {
      console.error('Clear failed error:', error);
      alert('Failed to clear failed uploads: ' + error.message);
    } finally {
      setClearingFailed(false);
    }
  };

  const handleIngestDocument = async (knowledgeId: string, title: string) => {
    if (ingestingIds.includes(knowledgeId)) {
      return;
    }

    setIngestingIds(prev => [...prev, knowledgeId]);
    setUploadProgress(`Starting ingestion for ${title}...`);
    addUploadLog(`Starting ingestion for ${title}`);

    try {
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ knowledgeId })
      });

      if (res.ok) {
        const data = await res.json();
        setUploadProgress(`✓ Ingested ${title} - ${data.chunksCreated} chunks processed.`);
        setTimeout(() => {
          setUploadProgress('');
        }, 5000);
        addUploadLog(`Ingested ${title} (${data.chunksCreated} chunks).`);
      } else {
        const error = await res.json().catch(() => ({ error: 'Failed to ingest document' }));
        const message = error.error || 'Failed to ingest document';
        setUploadProgress(`⚠️ ${title}: ${message}`);
        alert(message);
        addUploadLog(`Failed to ingest ${title}: ${message}`);
      }
    } catch (error: any) {
      console.error('Ingestion error:', error);
      setUploadProgress(`Failed to ingest ${title}: ${error.message || 'Unknown error'}`);
      alert(`Failed to ingest ${title}: ${error.message || 'Unknown error'}`);
      addUploadLog(`Failed to ingest ${title}: ${error.message || 'Unknown error'}`);
    } finally {
      setIngestingIds(prev => prev.filter(id => id !== knowledgeId));
      loadItems();
    }
  };

  const handleViewFile = async (item: any) => {
    if (!item.storage_path) {
      router.push(`/admin/content/knowledge-base/${item.id}`);
      return;
    }

    setDownloadingId(item.id);
    try {
      const res = await fetch(`/api/knowledge/file?id=${item.id}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to open file' }));
        alert(error.error || 'Failed to open file');
        addUploadLog(`Failed to open ${item.title}: ${error.error || 'Unknown error'}`);
        return;
      }
      const data = await res.json();
      window.open(data.url, '_blank', 'noopener,noreferrer');
      addUploadLog(`Opened ${item.title} in new tab.`);
    } catch (error: any) {
      console.error('View file error:', error);
      alert('Failed to open file: ' + (error.message || 'Unknown error'));
      addUploadLog(`Failed to open ${item.title}: ${error.message || 'Unknown error'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelIngestion = async (knowledgeId: string, title: string) => {
    if (!confirm(`Stop ingesting “${title}”?`)) {
      return;
    }

    try {
      const res = await fetch('/api/knowledge/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ knowledgeId })
      });

      if (res.ok) {
        setUploadProgress(`Ingestion cancelled for ${title}.`);
        addUploadLog(`Cancelled ingestion for ${title}.`);
      } else {
        const error = await res.json().catch(() => ({ error: 'Failed to cancel ingestion' }));
        alert(error.error || 'Failed to cancel ingestion');
        addUploadLog(`Failed to cancel ingestion for ${title}: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Cancel ingestion error:', error);
      alert('Failed to cancel ingestion: ' + (error.message || 'Unknown error'));
      addUploadLog(`Failed to cancel ingestion for ${title}: ${error.message || 'Unknown error'}`);
    } finally {
      loadItems();
    }
  };

  const handleTextUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!textContent.trim()) {
      alert('Please paste some text to upload.');
      return;
    }

    setTextUploading(true);
    setUploadProgress(`Uploading text: ${textTitle || 'Untitled text upload'}...`);
    addUploadLog(`Uploading text: ${textTitle || 'Untitled text upload'}`);

    try {
      const res = await fetch('/api/knowledge/upload-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: textTitle,
          content: textContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUploadProgress(`✓ Text uploaded and ingested (${data.chunksCreated} chunks).`);
        setTextTitle('');
        setTextContent('');
        loadItems();
        addUploadLog(`Text ingested (${data.chunksCreated} chunks).`);
      } else {
        const error = await res.json().catch(() => ({ error: 'Failed to upload text' }));
        alert(error.error || 'Failed to upload text');
        addUploadLog(`Failed to upload text: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Text upload error:', error);
      alert('Failed to upload text: ' + (error.message || 'Unknown error'));
      addUploadLog(`Failed to upload text: ${error.message || 'Unknown error'}`);
    } finally {
      setTextUploading(false);
    }
  };

  const getIngestionProgress = (item: KnowledgeBaseItem) => {
    // Parse progress from body field (format: [Stage] XX% or [PROGRESS:Stage:XX%])
    if (item.status !== 'ingesting') return null;
    
    const body = item.body || '';
    
    // Try new format first: [PROGRESS:Stage:XX%]
    let match = body.match(/\[PROGRESS:([^:]+)(?::(\d+)%)?\]/);
    if (match) {
      return {
        stage: match[1],
        progress: match[2] ? parseInt(match[2]) : undefined
      };
    }
    
    // Try old format: [Stage] XX%
    match = body.match(/\[([^\]]+)\](?:\s+(\d+)%)?/);
    if (match && match[1] !== 'PROGRESS') {
      return {
        stage: match[1],
        progress: match[2] ? parseInt(match[2]) : undefined
      };
    }
    
    // If body contains actual document text (not progress), check if we can infer stage
    // If body has substantial content, it's likely past parsing stage
    if (body.length > 100 && !body.includes('[') && !body.includes('PROGRESS')) {
      // Document has been parsed, likely stuck at embedding or storing stage
      return {
        stage: 'Generating embeddings',
        progress: undefined // Unknown progress
      };
    }
    
    return null;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
      published: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200' },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900', darkText: 'dark:text-gray-200' },
      ingested: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200' },
      ingesting: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-200' },
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-900', darkText: 'dark:text-orange-200' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-200' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
        {status === 'ingesting' && <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />}
        {status}
      </span>
    );
  };

  const filteredItems = statusFilter
    ? items.filter(item => item.status === statusFilter)
    : items;

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading knowledge base...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage knowledge base articles and document uploads</p>
          </div>
          <div className="flex gap-2">
          <Link
            href="/admin/content/knowledge-base/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Article
          </Link>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-[#2d437a] bg-gray-50 dark:bg-[#1a2a57]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Drag and drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported: PDF, DOCX, TXT, MD, CSV (Max 25MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          {uploading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{uploadProgress}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleTextUpload} className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Paste text directly</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">Paste plain text and we’ll ingest it as a knowledge base document.</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="textTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title</label>
              <input
                id="textTitle"
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Untitled text upload"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Text content</label>
              <textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                placeholder="Paste text here..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{textContent.length} / 200000 characters</div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={textUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {textUploading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {textUploading ? 'Uploading...' : 'Upload text'}
              </button>
            </div>
          </div>
        </form>

        {uploadProgress && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-200 px-4 py-3 rounded-lg">
            {uploadProgress}
          </div>
        )}
        {uploadLogs.length > 0 && (
          <div className="bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent upload activity</h3>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              {uploadLogs.map((log, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
                  <span>{log}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Smart Search */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search knowledge base (e.g., 'capacity', 'safety procedures')..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#23408e] border border-gray-200 dark:border-[#2d437a] rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-[#2d437a]">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="p-4 border-b border-gray-200 dark:border-[#2d437a] hover:bg-gray-50 dark:hover:bg-[#1a2a57] cursor-pointer"
                  onClick={() => {
                    // Navigate to document detail view
                    router.push(`/admin/content/knowledge-base/${result.knowledgeId}`);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{result.title}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(result.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {result.content}
                  </p>
                  {result.metadata?.chunkIndex !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Chunk {result.metadata.chunkIndex + 1}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <EyeIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Published/Ingested</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {items.filter((a: any) => a.status === 'published' || a.status === 'ingested').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArrowPathIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Processing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {items.filter((a: any) => a.status === 'ingesting' || a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Failed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {items.filter((a: any) => a.status === 'failed').length}
                </p>
                </div>
              </div>
              {items.filter((a: any) => a.status === 'failed').length > 0 && (
                <button
                  onClick={handleClearFailed}
                  disabled={clearingFailed}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Clear all failed uploads"
                >
                  {clearingFailed ? (
                    <>
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-3 w-3" />
                      Clear
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white dark:bg-[#23408e] rounded-xl border border-gray-200 dark:border-[#2d437a] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Documents</h2>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-[#2d437a] rounded-lg bg-white dark:bg-[#1a2a57] text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="ingested">Ingested</option>
                <option value="draft">Draft</option>
                <option value="ingesting">Ingesting</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#1a2a57]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#23408e] divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item: any) => {
                    const ingestionProgress = getIngestionProgress(item);
                    const isIngesting = item.status === 'ingesting';
                    const isPending = item.status === 'pending';
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2a57]">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </div>
                          {item.error && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Error: {item.error}
                            </div>
                          )}
                          {isIngesting && (
                            <div className="mt-2 space-y-1">
                              {ingestionProgress ? (
                                <>
                                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>{ingestionProgress.stage}</span>
                                    {ingestionProgress.progress !== undefined && (
                                      <span>{ingestionProgress.progress}%</span>
                                    )}
                                  </div>
                                  {ingestionProgress.progress !== undefined && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${ingestionProgress.progress}%` }}
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>Processing document...</span>
                                    <span className="animate-pulse">●</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full animate-pulse"
                                      style={{ width: '30%' }}
                                    />
                                  </div>
                                </>
                              )}
                              {item.bytes && (
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  File size: {formatFileSize(item.bytes)}
                                </div>
                              )}
                            </div>
                          )}
                          {isPending && (
                            <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <div>Uploaded. Click ingest to process this document.</div>
                              {item.bytes && (
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  File size: {formatFileSize(item.bytes)}
                                </div>
                              )}
                        </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-300 uppercase">
                          {item.type || 'article'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).slice(0, 3).map((tag: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {tag}
                            </span>
                          ))}
                          {(item.tags || []).length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{(item.tags || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {(item.status === 'pending' || item.status === 'failed' || item.status === 'ingested') && (
                            <button
                              onClick={() => handleIngestDocument(item.id, item.title)}
                              disabled={ingestingIds.includes(item.id) || item.status === 'ingesting'}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ingestingIds.includes(item.id) || item.status === 'ingesting' ? (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  Ingesting...
                                </>
                              ) : item.status === 'pending' ? (
                                <>
                                  <DocumentArrowUpIcon className="h-4 w-4" />
                                  Ingest
                                </>
                              ) : item.status === 'failed' ? (
                                <>
                                  <ArrowPathIcon className="h-4 w-4" />
                                  Retry ingest
                                </>
                              ) : (
                                <>
                                  <ArrowPathIcon className="h-4 w-4" />
                                  Re-ingest
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleViewFile(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={downloadingId === item.id}
                          >
                            <EyeIcon className="h-4 w-4" />
                            {downloadingId === item.id ? 'Opening...' : 'View' }
                          </button>
                          <button
                            onClick={() => router.push(`/admin/content/knowledge-base/${item.id}`)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 flex items-center gap-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Details
                          </button>
                          {item.status === 'ingesting' && (
                            <button
                              onClick={() => handleCancelIngestion(item.id, item.title)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                            >
                              <XMarkIcon className="h-4 w-4" />
                              Stop ingest
                            </button>
                          )}
                          {(item.status === 'ingested' || item.status === 'published') && (
                            <button
                              onClick={() => router.push(`/admin/content/knowledge-base/${item.id}?context=true`)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                            >
                              <BookOpenIcon className="h-4 w-4" />
                              Context
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No knowledge base items found. Upload a document or create an article to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
