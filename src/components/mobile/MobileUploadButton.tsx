import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface MobileUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  isUploading?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
}

const MobileUploadButton: React.FC<MobileUploadButtonProps> = ({
  onFileSelect,
  isUploading = false,
  disabled = false,
  multiple = true,
  accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif'
}) => {
  const { translate } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Mobile-optimized upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }
        `}
      >
        <div className="p-6 text-center">
          {/* Upload icon */}
          <div className="mx-auto mb-4">
            {isUploading ? (
              <div className="w-12 h-12 mx-auto">
                <svg className="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Upload text */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isUploading 
                ? translate('upload.uploading') 
                : translate('upload.tapToSelect')
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isUploading 
                ? translate('upload.pleaseWait')
                : translate('upload.orDragAndDrop')
              }
            </p>
          </div>

          {/* Supported formats */}
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            <p>{translate('upload.supportedFormats')}</p>
            <p className="mt-1">PDF, DOC, DOCX, TXT, JPG, PNG, GIF</p>
          </div>
        </div>

        {/* Progress overlay for uploading state */}
        {isUploading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {translate('upload.processing')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick action buttons for mobile */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium">
            {translate('upload.selectFiles')}
          </span>
        </button>

        <button
          onClick={() => {
            // Trigger camera on mobile devices
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute('capture', 'environment');
              fileInputRef.current.setAttribute('accept', 'image/*');
              fileInputRef.current.click();
            }
          }}
          disabled={disabled || isUploading}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">
            {translate('upload.takePhoto')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileUploadButton;
