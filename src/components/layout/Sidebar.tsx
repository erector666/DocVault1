import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../context/LanguageContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getStorageUsage } from '../../services/storageService';
import { getCategoryStats } from '../../services/aiService';

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const { translate } = useLanguage();
  const { currentUser } = useSupabaseAuth();

  // Fetch real storage usage data
  const { data: storageData, isLoading, error } = useQuery({
    queryKey: ['storageUsage', currentUser?.id],
    queryFn: () => getStorageUsage(currentUser?.id || ''),
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch category statistics for document counts
  const { data: categoryStats = {} } = useQuery({
    queryKey: ['category-stats', currentUser?.id],
    queryFn: () => getCategoryStats(currentUser?.id || ''),
    enabled: !!currentUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const totalStorage = 1 * 1024 * 1024 * 1024; // 1 GB in bytes (Supabase free tier)
  const usedStorage = storageData?.totalSize ?? 0;
  const usagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Get total document count
  const getTotalCount = () => {
    return Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div
      className={`h-full bg-white dark:bg-gray-800 shadow-md flex flex-col ${
        isMobile ? 'w-64' : 'w-60'
      } ${
        isMobile ? 'fixed inset-y-0 left-0 z-50' : 'sticky top-0'
      }`}
    >
      {/* Logo and Close Button (Mobile) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <img src="/logo2.png" alt="DocVault Logo" className="h-8 w-8 rounded-full" />
          <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
            DocVault
          </span>
        </div>
        
        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <NavLink 
              to="/dashboard" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors touch-manipulation ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="ml-3 text-base md:text-lg">
                {translate('dashboard')}
              </span>
            </NavLink>
          </li>

          {/* Quick Upload Button */}
          <li className="pt-2">
            <NavLink 
              to="/upload" 
              onClick={handleLinkClick}
              className="flex items-center p-3 rounded-lg transition-colors touch-manipulation bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="ml-3 text-base md:text-lg">
                Upload Documents
              </span>
            </NavLink>
          </li>

          {/* Categories */}
          <li className="pt-4">
            <div className="flex items-center px-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {translate('categories')}
              </span>
            </div>

            {/* All Documents */}
            <NavLink 
              to="/dashboard" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">📁</span>
                <span className="ml-3 text-sm">All Documents</span>
              </div>
              {getTotalCount() > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                  {getTotalCount()}
                </span>
              )}
            </NavLink>

            {/* Personal */}
            <NavLink 
              to="/category/personal" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">👤</span>
                <span className="ml-3 text-sm">Personal</span>
              </div>
              {(categoryStats['Personal'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Personal']}
                </span>
              )}
            </NavLink>

            {/* Bills & Utilities */}
            <NavLink 
              to="/category/bills" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">💡</span>
                <span className="ml-3 text-sm">Bills & Utilities</span>
              </div>
              {(categoryStats['Bills & Utilities'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Bills & Utilities']}
                </span>
              )}
            </NavLink>

            {/* Medical */}
            <NavLink 
              to="/category/medical" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">🏥</span>
                <span className="ml-3 text-sm">Medical</span>
              </div>
              {(categoryStats['Medical'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Medical']}
                </span>
              )}
            </NavLink>

            {/* Legal */}
            <NavLink 
              to="/category/legal" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">⚖️</span>
                <span className="ml-3 text-sm">Legal</span>
              </div>
              {(categoryStats['Legal'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Legal']}
                </span>
              )}
            </NavLink>

            {/* Financial */}
            <NavLink 
              to="/category/financial" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">💰</span>
                <span className="ml-3 text-sm">Financial</span>
              </div>
              {(categoryStats['Financial'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Financial']}
                </span>
              )}
            </NavLink>

            {/* Work & Business */}
            <NavLink 
              to="/category/work" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">💼</span>
                <span className="ml-3 text-sm">Work & Business</span>
              </div>
              {(categoryStats['Work & Business'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Work & Business']}
                </span>
              )}
            </NavLink>

            {/* Education */}
            <NavLink 
              to="/category/education" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">🎓</span>
                <span className="ml-3 text-sm">Education</span>
              </div>
              {(categoryStats['Education'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Education']}
                </span>
              )}
            </NavLink>

            {/* Travel */}
            <NavLink 
              to="/category/travel" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">✈️</span>
                <span className="ml-3 text-sm">Travel</span>
              </div>
              {(categoryStats['Travel'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Travel']}
                </span>
              )}
            </NavLink>

            {/* Insurance */}
            <NavLink 
              to="/category/insurance" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">🛡️</span>
                <span className="ml-3 text-sm">Insurance</span>
              </div>
              {(categoryStats['Insurance'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Insurance']}
                </span>
              )}
            </NavLink>

            {/* Other */}
            <NavLink 
              to="/category/other" 
              onClick={handleLinkClick}
              className={({ isActive }) => 
                `flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <div className="flex items-center">
                <span className="text-2xl">📄</span>
                <span className="ml-3 text-sm">Other</span>
              </div>
              {(categoryStats['Other'] || 0) > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {categoryStats['Other']}
                </span>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        {/* Storage Indicator */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span className="text-sm font-medium">
              Storage
            </span>
          </div>
          <div>
            {isLoading ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading storage...</p>
            ) : error ? (
              <p className="text-xs text-red-500 dark:text-red-400">Error loading storage</p>
            ) : storageData ? (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${usagePercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{formatBytes(usedStorage)} used</span>
                  <span>{formatBytes(totalStorage - usedStorage)} left</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {storageData.documentCount} file{storageData.documentCount !== 1 ? 's' : ''} • {formatBytes(totalStorage)} total
                </p>
              </>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
