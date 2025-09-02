import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';
import { Document } from '../../services/documentService';

interface DocumentViewerProps {
  documentId?: string;
  document?: Document;
  isOpen?: boolean;
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, document: propDocument, isOpen = true, onClose }) => {
  const { translate } = useLanguage();
  const [document, setDocument] = useState<Document | null>(propDocument || null);
  const [loading, setLoading] = useState<boolean>(!propDocument);
  const [error, setError] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'pdf' | 'image' | 'text' | 'other'>('other');

  useEffect(() => {
    // If we have a document prop, use it directly
    if (propDocument) {
      setDocument(propDocument);
      setLoading(false);
      determineViewerType(propDocument);
      return;
    }

    // Otherwise fetch by ID
    if (documentId) {
      fetchDocument();
    }
  }, [documentId, propDocument]);

  const determineViewerType = (doc: Document) => {
    if (doc.type === 'application/pdf') {
      setViewerType('pdf');
    } else if (doc.type.startsWith('image/')) {
      setViewerType('image');
    } else if (
      doc.type === 'text/plain' ||
      doc.type === 'text/html' ||
      doc.type === 'application/json'
    ) {
      setViewerType('text');
    } else {
      setViewerType('other');
    }
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get document metadata from Supabase
      const { data: documentData, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !documentData) {
        console.error('Document fetch error:', fetchError);
        setError(translate('viewer.error.notFound'));
        setLoading(false);
        return;
      }

      determineViewerType(documentData);
      setDocument(documentData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(translate('viewer.error.fetchFailed'));
      setLoading(false);
    }
  };

  // If not open, don't render
  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading document...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Document not found'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const renderViewer = () => {
    switch (viewerType) {
      case 'pdf':
        return (
          <iframe
            src={document.url}
            className="w-full h-full border-0"
            title={document.name}
            style={{ minHeight: '600px' }}
          />
        );
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={document.url}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );
      case 'text':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md h-full overflow-auto">
            <iframe
              src={document.url}
              className="w-full h-full border-0"
              title={document.name}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {document.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This file type cannot be previewed directly
              </p>
              <a
                href={document.url}
                download={document.name}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
            {document.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
