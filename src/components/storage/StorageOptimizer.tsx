import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { supabase } from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface StorageStats {
  totalSize: number;
  usedSize: number;
  documentCount: number;
  categoryBreakdown: Record<string, { size: number; count: number }>;
  largestFiles: Array<{ name: string; size: number; id: string }>;
}

const StorageOptimizer: React.FC = () => {
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadStorageStats();
    }
  }, [currentUser?.id]);

  const loadStorageStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, name, size, category')
        .eq('user_id', currentUser?.id);

      if (error) throw error;

      const totalSize = documents?.reduce((sum, doc) => sum + doc.size, 0) || 0;
      const documentCount = documents?.length || 0;
      
      // Category breakdown
      const categoryBreakdown: Record<string, { size: number; count: number }> = {};
      documents?.forEach(doc => {
        const category = doc.category || 'Other';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { size: 0, count: 0 };
        }
        categoryBreakdown[category].size += doc.size;
        categoryBreakdown[category].count += 1;
      });

      // Largest files
      const largestFiles = documents
        ?.sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(doc => ({ name: doc.name, size: doc.size, id: doc.id })) || [];

      setStats({
        totalSize,
        usedSize: totalSize,
        documentCount,
        categoryBreakdown,
        largestFiles
      });
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeStorage = async () => {
    setIsOptimizing(true);
    try {
      // Simulate storage optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Compress images
      // 2. Remove duplicate files
      // 3. Archive old documents
      // 4. Clean up orphaned files
      
      await loadStorageStats();
    } catch (error) {
      console.error('Error optimizing storage:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const usagePercentage = (stats.usedSize / (100 * 1024 * 1024)) * 100; // Assuming 100MB limit

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Storage Overview
        </h2>
        <button
          onClick={optimizeStorage}
          disabled={isOptimizing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Storage'}
        </button>
      </div>

      {/* Storage Usage */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Storage Used
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(stats.usedSize)} / 100 MB
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              usagePercentage > 80 ? 'bg-red-600' : usagePercentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.documentCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Documents
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatFileSize(stats.totalSize)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Size
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Storage by Category
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category} ({data.count} files)
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(data.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Largest Files */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Largest Files
        </h3>
        <div className="space-y-2">
          {stats.largestFiles.slice(0, 5).map((file, index) => (
            <div key={file.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xs text-gray-400 w-4">
                  {index + 1}.
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate ml-2">
                  {file.name}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorageOptimizer;
