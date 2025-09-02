import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Share2, Edit3, Eye, Image, File, FileArchive, FileVideo, FileAudio } from 'lucide-react';
import { deleteDocument, syncWithSupabase, supabase } from '../../services/supabase';
import DocumentViewer from '../viewer/DocumentViewer';

interface DocumentListProps {
  userId: string;
  category?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ userId, category }) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Auto-sync state
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  
  // Use ref to store the autoSync function to avoid dependency issues
  const autoSyncRef = useRef<() => Promise<void>>();

  // Auto-sync function
  const autoSync = useCallback(async () => {
    if (isAutoSyncing) return; // Prevent multiple simultaneous syncs
    
    try {
      setIsAutoSyncing(true);
      console.log('🔄 Auto-syncing with Supabase...');
      
      await syncWithSupabase(userId);
      
      // Invalidate and refetch all document-related queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['storageUsage'] });
      
      console.log('✅ Auto-sync completed');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    } finally {
      setIsAutoSyncing(false);
    }
  }, [userId, queryClient, isAutoSyncing]);

  // Store the function in ref
  autoSyncRef.current = autoSync;

  // Fetch documents with auto-refresh and category filtering
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documents', userId, category],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply category filter if specified
      if (category && category !== 'ALL') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: true, // Refresh when user returns to app
    refetchOnMount: true,
  });

  // Auto-sync on mount and after operations
  useEffect(() => {
    // Initial sync on mount
    if (autoSyncRef.current) {
      autoSyncRef.current();
    }
    
    // Set up periodic auto-sync - reduced frequency to prevent spam
    const interval = setInterval(() => {
      if (autoSyncRef.current) {
        autoSyncRef.current();
      }
    }, 300000); // Every 5 minutes instead of every minute
    
    // Auto-sync when user returns to app
    const handleFocus = () => {
      console.log('🔄 User returned to app, auto-syncing...');
      if (autoSyncRef.current) {
        autoSyncRef.current();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // No dependencies needed

  // Delete mutation with auto-sync
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      setIsDeleting(documentId);
      await deleteDocument(documentId);
    },
    onSuccess: async () => {
      // Auto-sync after successful deletion
      await autoSync();
      
      // Also invalidate queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['storageUsage'] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      alert('Failed to delete document');
    },
    onSettled: () => {
      setIsDeleting(null);
    },
  });

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(documentId);
    }
  };

  const getFileIcon = (type: string, name: string) => {
    if (type?.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type?.startsWith('application/pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type?.startsWith('text/')) return <FileText className="h-8 w-8 text-green-500" />;
    if (type?.startsWith('video/')) return <FileVideo className="h-8 w-8 text-purple-500" />;
    if (type?.startsWith('audio/')) return <FileAudio className="h-8 w-8 text-yellow-500" />;
    if (type?.startsWith('application/zip') || type?.startsWith('application/x-rar')) return <FileArchive className="h-8 w-8 text-orange-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error loading documents: {error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {category ? `No documents in ${category}` : 'No documents yet'}
        </h3>
        <p className="text-gray-500 mb-4">
          {category ? `Upload your first document to this category to get started` : 'Upload your first document to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-sync status indicator */}
      {isAutoSyncing && (
        <div className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm text-blue-600">Auto-syncing with Supabase...</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {category ? `${category} Documents` : 'Documents'} ({documents.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.map((document) => (
            <div
              key={document.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              onClick={() => handleDocumentClick(document)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon(document.type, document.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(document.size)} • {formatDate(document.created_at)}
                  </p>
                  {document.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {document.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentClick(document);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit/annotate
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit/Annotate"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle share
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(document.id);
                    }}
                    disabled={isDeleting === document.id}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === document.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isViewerOpen && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

