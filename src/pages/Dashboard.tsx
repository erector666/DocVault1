import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentList } from '../components/documents';
import UploadModal from '../components/upload/UploadModal';
import CategoryFilter from '../components/documents/CategoryFilter';
import { useUploadModal } from '../context/UploadModalContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { getCategoryStats, DocumentCategory } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';

const Dashboard: React.FC = () => {
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const { isUploadModalOpen, openModal, closeModal } = useUploadModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'ALL'>('ALL');

  // Fetch category statistics
  const { data: categoryStats = {} } = useQuery({
    queryKey: ['category-stats', currentUser?.id],
    queryFn: () => getCategoryStats(currentUser?.id || ''),
    enabled: !!currentUser?.id
  });

  const handleDocumentClick = (document: any) => {
    // Handle document click - could navigate to document view
    console.log('Document clicked:', document);
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
        
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>{translate('upload_documents')}</span>
        </button>
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

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryStats={categoryStats}
      />

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
