import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentUpload from '../../components/upload/DocumentUpload';
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { LanguageProvider } from '../../context/LanguageContext';

// Mock services
jest.mock('../../services/supabase', () => ({
  uploadDocument: jest.fn()
}));

jest.mock('../../services/virusScanner', () => ({
  performSecurityCheck: jest.fn()
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
};

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload area', () => {
    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/click to select/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockResolvedValue([{ id: 'doc-1', name: 'test.pdf' }]);

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockPerformSecurityCheck).toHaveBeenCalledWith(file);
      expect(mockUploadDocument).toHaveBeenCalled();
    });
  });

  it('should show upload progress', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('should handle security check failures', async () => {
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({
      passed: false,
      threats: ['Suspicious file extension']
    });

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const file = new File(['malicious content'], 'malware.exe', { type: 'application/octet-stream' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/security check failed/i)).toBeInTheDocument();
      expect(screen.getByText(/suspicious file extension/i)).toBeInTheDocument();
    });
  });

  it('should handle upload errors', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockRejectedValue(new Error('Upload failed'));

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('should handle multiple file uploads', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockResolvedValue([{ id: 'doc-1', name: 'test1.pdf' }]);

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const files = [
      new File(['content 1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content 2'], 'test2.pdf', { type: 'application/pdf' })
    ];
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(mockPerformSecurityCheck).toHaveBeenCalledTimes(2);
      expect(mockUploadDocument).toHaveBeenCalledTimes(2);
    });
  });

  it('should show file validation errors', async () => {
    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    // Create a file that's too large
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
    });
  });

  it('should handle drag and drop', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockResolvedValue([{ id: 'doc-1', name: 'test.pdf' }]);

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const dropArea = screen.getByText(/drag and drop/i).closest('div');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Simulate drag over
    fireEvent.dragOver(dropArea!, {
      dataTransfer: { files: [file] }
    });

    // Simulate drop
    fireEvent.drop(dropArea!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockPerformSecurityCheck).toHaveBeenCalledWith(file);
      expect(mockUploadDocument).toHaveBeenCalled();
    });
  });

  it('should show category selection', () => {
    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('should handle category selection', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockResolvedValue([{ id: 'doc-1', name: 'test.pdf' }]);

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    // Select category
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'Invoice' } });

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i);
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadDocument).toHaveBeenCalledWith(
        file,
        expect.any(String), // userId
        'Invoice'
      );
    });
  });

  it('should clear files after successful upload', async () => {
    const mockUploadDocument = require('../../services/supabase').uploadDocument;
    const mockPerformSecurityCheck = require('../../services/virusScanner').performSecurityCheck;
    
    mockPerformSecurityCheck.mockResolvedValue({ passed: true, threats: [] });
    mockUploadDocument.mockResolvedValue([{ id: 'doc-1', name: 'test.pdf' }]);

    render(
      <TestWrapper>
        <DocumentUpload />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload documents/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadDocument).toHaveBeenCalled();
    });

    // Check that input is cleared
    expect(input.value).toBe('');
  });
});
