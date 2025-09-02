import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { deleteDocument } from '../../services/supabase';
import { Document } from '../../types/document';
import { searchDocuments } from '../../services/searchService';
import DocumentTranslation from '../translation/DocumentTranslation';
import DocumentViewer from '../viewer/DocumentViewer';
import DocumentPagination from './DocumentPagination';
import { useLanguage } from '../../context/LanguageContext';

interface DocumentListProps {
  searchTerm?: string;
  category?: string;
  onViewDocument?: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  searchTerm = '', 
  category,
  onViewDocument 
}) => {
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { 
    data: searchResult, 
    isLoading, 
    error,
    isError,
    refetch
  } = useQuery({
    queryKey: ['documents', currentUser?.id, searchTerm, category, currentPage],
    queryFn: async () => {
      if (!currentUser?.id) return { documents: [], totalCount: 0 };
      
      const offset = (currentPage - 1) * itemsPerPage;
      const filters = category ? { category } : {};
      
      return await searchDocuments(searchTerm, currentUser.id, filters, itemsPerPage, offset);
    },
    enabled: !!currentUser?.id,
    staleTime: 30000,
    gcTime: 300000,
    placeholderData: (previousData) => previousData
  });

  const documents = searchResult?.documents || [];
  const totalCount = searchResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleDocumentClick = (document: Document) => {
    if (onViewDocument) {
      onViewDocument(document);
    } else {
      navigate(`/document/${document.id}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation();
    setSelectedDocument(document);
    setIsDeleteModalOpen(true);
  };

  const handleTranslateClick = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation();
    setSelectedDocument(document);
    setIsTranslationModalOpen(true);
  };

  const handleTranslationComplete = (translatedDocument: Document) => {
    console.log('Translation completed:', translatedDocument);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    setIsTranslationModalOpen(false);
    setSelectedDocument(null);
  };

  const handleTranslationCancel = () => {
    setIsTranslationModalOpen(false);
    setSelectedDocument(null);
  };

  const handleViewerClose = () => {
    setIsViewerModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    
    try {
      console.log('Deleting document:', selectedDocument.id);
      await deleteDocument(selectedDocument.id);
      console.log('Document deleted successfully, invalidating cache...');
      
      // Force invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading documents...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          Error loading documents: {(error as Error)?.message || 'Unknown error'}
        </p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {searchTerm ? 'No documents found' : 'No documents yet'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchTerm 
            ? `No documents match "${searchTerm}"`
            : 'Upload your first document to get started'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document: Document) => (
        <div
          key={document.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleDocumentClick(document)}
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0 self-center sm:self-start">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {document.name}
                    </h3>
                    <div className="mt-1 flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <p>{formatFileSize(document.size)}</p>
                      <p className="hidden sm:block">•</p>
                      <p>{formatDate(document.created_at)}</p>
                      {document.category && (
                        <>
                          <p className="hidden sm:block">•</p>
                          <p className="text-blue-600 dark:text-blue-400">{document.category}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex justify-center sm:justify-end space-x-3 sm:space-x-2">
                    <button
                      onClick={(e) => handleTranslateClick(e, document)}
                      className="p-2 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                      title={translate('translation.translate')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, document)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg"
                      title={translate('common.delete')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <DocumentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {translate('documents.delete.confirm')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {translate('documents.delete.warning', { name: selectedDocument.name })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {translate('common.cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {translate('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      {isTranslationModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DocumentTranslation
              document={selectedDocument}
              onTranslationComplete={handleTranslationComplete}
              onCancel={handleTranslationCancel}
            />
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {isViewerModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[90vh]">
            <DocumentViewer
              documentId={selectedDocument.id}
              onClose={handleViewerClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default DocumentList;
