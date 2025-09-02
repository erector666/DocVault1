import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { DocumentList } from '../components/documents';
import { UploadModal } from '../components/upload';

const CategoryView: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { translate } = useLanguage();
  const { currentUser } = useSupabaseAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Map category name to display name and database category
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { displayName: string; dbCategory: string }> = {
      'personal': { displayName: 'Personal', dbCategory: 'Personal' },
      'bills': { displayName: 'Bills & Utilities', dbCategory: 'Bills & Utilities' },
      'medical': { displayName: 'Medical', dbCategory: 'Medical' },
      'legal': { displayName: 'Legal', dbCategory: 'Legal' },
      'financial': { displayName: 'Financial', dbCategory: 'Financial' },
      'work': { displayName: 'Work & Business', dbCategory: 'Work & Business' },
      'education': { displayName: 'Education', dbCategory: 'Education' },
      'travel': { displayName: 'Travel', dbCategory: 'Travel' },
      'insurance': { displayName: 'Insurance', dbCategory: 'Insurance' },
      'other': { displayName: 'Other', dbCategory: 'Other' }
    };
    return categoryMap[category.toLowerCase()] || { displayName: category, dbCategory: category };
  };

  const categoryInfo = getCategoryInfo(categoryName || '');

  const handleUploadComplete = () => {
    // Refresh the document list
    setIsUploadModalOpen(false);
  };

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {categoryInfo.displayName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Category documents
            </p>
          </div>
          
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload Document</span>
          </button>
        </div>

        {/* Document List */}
        <DocumentList userId={currentUser?.id || ''} category={categoryInfo.dbCategory} />
      </div>
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
};

export default CategoryView;
