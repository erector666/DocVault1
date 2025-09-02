import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument } from '../services/documentService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Document } from '../types/document';
import { 
  ArrowLeftIcon, 
  DocumentIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, formatDate } from '../utils/formatters';

const DocumentView: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Fetch document details
  const { 
    data: document, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId!),
    enabled: !!documentId && !!currentUser,
    staleTime: 60000, // 1 minute
  });

  // Get document icon based on file type
  const getDocumentIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type === 'application/pdf') {
      return '📄';
    } else if (type.includes('word') || type.includes('document')) {
      return '📝';
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return '📊';
    } else {
      return '📁';
    }
  };

  // Handle download
  const handleDownload = () => {
    if (document?.url) {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
        <p className="text-red-600 dark:text-red-400">
          {translate('documents.error.notFound')}
        </p>
        <button
          onClick={handleBack}
          className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          ← {translate('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {translate('common.back')}
        </button>
        
        <button
          onClick={handleDownload}
          className="flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {translate('common.download')}
        </button>
      </div>

      {/* Document Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">
            {getDocumentIcon(document.type)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {document.name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(document.size)}
              </div>
              <div>
                <span className="font-medium">Type:</span> {document.type}
              </div>
              <div>
                <span className="font-medium">Uploaded:</span> {formatDate(document.created_at ? new Date(document.created_at) : new Date())}
              </div>
              <div>
                <span className="font-medium">Category:</span> {document.category || 'Uncategorized'}
              </div>
            </div>
            
            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {document.tags.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Processing Results */}
      {(document.category || document.tags) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
            🤖 Document Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            {document.category && (
              <div>
                <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Category</h3>
                <p className="text-blue-600 dark:text-blue-400">
                  {document.category}
                </p>
              </div>
            )}
            
            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div>
                <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {translate('documents.preview')}
        </h2>
        
        {document.type.startsWith('image/') ? (
          <div className="flex justify-center">
            <img
              src={document.url}
              alt={document.name}
              className={`max-w-full h-auto rounded-lg shadow-md transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              style={{ maxHeight: '600px' }}
            />
            {!isImageLoaded && (
              <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        ) : document.type === 'application/pdf' ? (
          <div className="text-center">
            <iframe
              src={document.url}
              className="w-full h-96 border rounded-lg"
              title={document.name}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {translate('documents.pdfPreviewNote')}
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {getDocumentIcon(document.type)}
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {translate('documents.noPreview')}
            </p>
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {translate('common.download')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentView;
