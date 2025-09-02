import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DocumentList } from '../../components/documents/DocumentList';
import { SupabaseAuthProvider } from '../../context/SupabaseAuthContext';
import { LanguageProvider } from '../../context/LanguageContext';

// Mock services
jest.mock('../../services/supabase', () => ({
  deleteDocument: jest.fn(),
  getDocuments: jest.fn()
}));

jest.mock('../../services/searchService', () => ({
  searchDocuments: jest.fn()
}));

jest.mock('../../services/translationService', () => ({
  translateDocument: jest.fn()
}));

const mockDocuments = [
  {
    id: 'doc-1',
    name: 'Test Document 1.pdf',
    size: 1024000,
    mimeType: 'application/pdf',
    category: 'Document',
    createdAt: '2024-01-01T00:00:00Z',
    url: 'https://example.com/doc1.pdf',
    userId: 'user-1',
    aiClassification: {
      category: 'Document',
      confidence: 0.85,
      method: 'keyword'
    }
  },
  {
    id: 'doc-2',
    name: 'Invoice 123.pdf',
    size: 512000,
    mimeType: 'application/pdf',
    category: 'Invoice',
    createdAt: '2024-01-02T00:00:00Z',
    url: 'https://example.com/doc2.pdf',
    userId: 'user-1',
    aiClassification: {
      category: 'Invoice',
      confidence: 0.92,
      method: 'ml'
    }
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DocumentList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock search service
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockResolvedValue({
      documents: mockDocuments,
      totalCount: 2,
      searchTime: 150
    });
  });

  it('should render document list', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invoice 123.pdf')).toBeInTheDocument();
    });
  });

  it('should display document metadata correctly', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // File size
    });
    
    await waitFor(() => {
      expect(screen.getByText('512.00 KB')).toBeInTheDocument(); // File size
    });
    
    await waitFor(() => {
      expect(screen.getByText('Document')).toBeInTheDocument(); // Category
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invoice')).toBeInTheDocument(); // Category
    });
  });

  it('should show AI classification badges', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // Confidence
    });
    
    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument(); // Confidence
    });
  });

  it('should handle document deletion', async () => {
    const mockDeleteDocument = require('../../services/supabase').deleteDocument;
    mockDeleteDocument.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion in modal
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/delete/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1');
    });
  });

  it('should handle document viewing', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Click view button
    const viewButtons = screen.getAllByLabelText(/view/i);
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/document viewer/i)).toBeInTheDocument();
    });
  });

  it('should handle document translation', async () => {
    const mockTranslateDocument = require('../../services/translationService').translateDocument;
    mockTranslateDocument.mockResolvedValue({
      translatedText: 'Translated content',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Click translate button
    const translateButtons = screen.getAllByLabelText(/translate/i);
    fireEvent.click(translateButtons[0]);

    // Select target language
    await waitFor(() => {
      expect(screen.getByText(/translate document/i)).toBeInTheDocument();
    });

    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    const translateButton = screen.getByText(/translate/i);
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(mockTranslateDocument).toHaveBeenCalled();
    });
  });

  it('should handle search functionality', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    fireEvent.change(searchInput, { target: { value: 'invoice' } });

    await waitFor(() => {
      expect(mockSearchDocuments).toHaveBeenCalledWith(
        'invoice',
        expect.any(String), // userId
        expect.any(Object), // filters
        expect.any(Number), // limit
        expect.any(Number)  // offset
      );
    });
  });

  it('should handle pagination', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Check if pagination controls are present
    const nextButton = screen.getByLabelText(/next page/i);
    expect(nextButton).toBeInTheDocument();

    const prevButton = screen.getByLabelText(/previous page/i);
    expect(prevButton).toBeInTheDocument();
  });

  it('should handle filter changes', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    // Open advanced search
    const advancedSearchButton = screen.getByText(/advanced search/i);
    fireEvent.click(advancedSearchButton);

    await waitFor(() => {
      expect(screen.getByText(/category/i)).toBeInTheDocument();
    });

    // Select category filter
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'Invoice' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockSearchDocuments).toHaveBeenCalledWith(
        '',
        expect.any(String),
        expect.objectContaining({ category: 'Invoice' }),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  it('should show loading state', () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockRejectedValue(new Error('Failed to fetch documents'));

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading documents/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no documents', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockResolvedValue({
      documents: [],
      totalCount: 0,
      searchTime: 50
    });

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });

  it('should handle document click', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Document 1.pdf'));
    
    // Add assertions for document click behavior
  });

  it('should handle search functionality', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add search functionality tests
  });

  it('should handle category filtering', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add category filtering tests
  });

  it('should handle document deletion', async () => {
    const mockDeleteDocument = require('../../services/supabase').deleteDocument;
    mockDeleteDocument.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add deletion tests
  });

  it('should handle translation functionality', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add translation tests
  });

  it('should handle pagination', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add pagination tests
  });

  it('should handle items per page change', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add items per page change tests
  });

  it('should handle search with no results', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockResolvedValue({
      documents: [],
      totalCount: 0,
      searchTime: 50
    });

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No documents found')).toBeInTheDocument();
    });
  });

  it('should handle error states', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockRejectedValue(new Error('Search failed'));

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading documents: Search failed')).toBeInTheDocument();
    });
  });

  it('should handle loading states', async () => {
    const mockSearchDocuments = require('../../services/searchService').searchDocuments;
    mockSearchDocuments.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('should handle document actions', async () => {
    render(
      <TestWrapper>
        <DocumentList userId="user-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    });

    // Add document actions tests
  });
});
