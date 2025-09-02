import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentList } from '../components/documents';
import UploadModal from '../components/upload/UploadModal';
import { useUploadModal } from '../context/UploadModalContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { DocumentCategory } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';
import { useAuditLogger } from '../services/auditLogger';
import { getStorageUsage } from '../services/storageService';

interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  timestamp: number;
  severity: string;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const { isUploadModalOpen, openModal, closeModal } = useUploadModal();
  const { query: queryAuditLogs } = useAuditLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Fetch storage usage data
  const { data: storageData } = useQuery({
    queryKey: ['storageUsage', currentUser?.id],
    queryFn: () => getStorageUsage(currentUser?.id || ''),
    enabled: !!currentUser?.id,
    refetchInterval: 300000, // Refetch every 5 minutes instead of 30 seconds
  });

  // Fetch recent activity
  useEffect(() => {
    if (currentUser?.id) {
      const activity = queryAuditLogs({
        userId: currentUser.id,
        limit: 5,
        success: true
      });
      
      // Transform audit events to display format
      const formattedActivity = activity.map(event => ({
        id: event.id,
        action: event.action,
        resource: event.resource,
        timestamp: event.timestamp,
        severity: event.severity
      }));
      
      setRecentActivity(formattedActivity);
    }
  }, [currentUser?.id]);

  const handleDocumentClick = (document: any) => {
    // Handle document click - could navigate to document view
    console.log('Document clicked:', document);
  };

  // Calculate storage usage
  const totalStorage = 1 * 1024 * 1024 * 1024; // 1 GB in bytes (Supabase free tier)
  const usedStorage = storageData?.totalSize ?? 0;
  const usagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : 0;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('upload')) return '📤';
    if (action.toLowerCase().includes('view') || action.toLowerCase().includes('review')) return '👁️';
    if (action.toLowerCase().includes('delete')) return '🗑️';
    if (action.toLowerCase().includes('search')) return '🔍';
    if (action.toLowerCase().includes('process')) return '⚙️';
    return '📄';
  };

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translate('dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {translate('manage_documents')}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input 
          type="search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full p-3 pl-10 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
          placeholder={`${translate('search')}...`} 
        />
      </div>

              {/* Quick Actions & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Storage Usage Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(usedStorage)}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0a2 2 0 012-2h10a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${Math.min(usagePercentage, 100)}%`}}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {usagePercentage.toFixed(1)}% of {formatBytes(totalStorage)} used
              </p>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
            </div>
            <div className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getActivityColor(item.severity)}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {getActivityIcon(item.action)} {item.action} on {item.resource} ({formatTimeAgo(item.timestamp)})
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start by uploading a document</p>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Document List */}
      <DocumentList userId={currentUser?.id || ''} />

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default Dashboard;
