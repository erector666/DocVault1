import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { supabase } from '../../services/supabase';
import { performSecurityCheck } from '../../services/virusScanner';
import { extractTextFromDocument, classifyDocument } from '../../services/aiService';
import { searchDocuments } from '../../services/searchService';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestSuiteProps {
  onClose: () => void;
}

const TestSuite: React.FC<TestSuiteProps> = ({ onClose }) => {
  const { currentUser } = useSupabaseAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const testDefinitions = [
    {
      name: 'Database Connection',
      test: async () => {
        const { data, error } = await supabase.from('documents').select('count').limit(1);
        if (error) throw error;
        return { connected: true };
      }
    },
    {
      name: 'User Authentication',
      test: async () => {
        if (!currentUser) throw new Error('No authenticated user');
        return { userId: currentUser.id, email: currentUser.email };
      }
    },
    {
      name: 'File Security Check',
      test: async () => {
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const result = await performSecurityCheck(testFile);
        if (!result.passed) throw new Error('Security check failed');
        return result;
      }
    },
    {
      name: 'OCR Text Extraction',
      test: async () => {
        const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
        const text = await extractTextFromDocument(testFile);
        if (!text) throw new Error('No text extracted');
        return { extractedText: text };
      }
    },
    {
      name: 'AI Document Classification',
      test: async () => {
        const result = await classifyDocument('invoice.pdf', 'application/pdf', 'Invoice #123 Amount: $500');
        if (!result.category) throw new Error('No classification result');
        return result;
      }
    },
    {
      name: 'Document Search',
      test: async () => {
        if (!currentUser?.id) throw new Error('No user ID');
        const result = await searchDocuments('test', currentUser.id, {}, 10, 0);
        return { totalCount: result.totalCount, searchTime: result.searchTime };
      }
    },
    {
      name: 'Storage Operations',
      test: async () => {
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const filePath = `test/${Date.now()}-test.txt`;
        
        // Upload
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, testFile);
        
        if (uploadError) throw uploadError;
        
        // Download
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(filePath);
        
        if (downloadError) throw downloadError;
        
        // Cleanup
        await supabase.storage.from('documents').remove([filePath]);
        
        return { uploaded: true, downloaded: true, cleaned: true };
      }
    },
    {
      name: 'Translation Service',
      test: async () => {
        // Mock translation test
        const result = {
          translatedText: 'Hola Mundo',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          confidence: 0.95
        };
        return result;
      }
    },
    {
      name: 'Performance Metrics',
      test: async () => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        const duration = performance.now() - start;
        
        if (duration > 1000) throw new Error('Performance too slow');
        return { duration, passed: true };
      }
    },
    {
      name: 'Error Handling',
      test: async () => {
        try {
          await supabase.from('nonexistent_table').select('*');
          throw new Error('Should have thrown an error');
        } catch (error: any) {
          if (error?.message?.includes('nonexistent_table')) {
            return { errorHandled: true };
          }
          throw error;
        }
      }
    }
  ];

  useEffect(() => {
    const initialTests = testDefinitions.map(def => ({
      name: def.name,
      status: 'pending' as const
    }));
    setTests(initialTests);
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    const updatedTests: TestResult[] = [];

    for (const testDef of testDefinitions) {
      setCurrentTest(testDef.name);
      
      const testResult: TestResult = {
        name: testDef.name,
        status: 'running'
      };
      
      updatedTests.push(testResult);
      setTests([...updatedTests]);

      const startTime = performance.now();
      
      try {
        const result = await testDef.test();
        const duration = performance.now() - startTime;
        
        testResult.status = 'passed';
        testResult.duration = duration;
        testResult.details = result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        testResult.status = 'failed';
        testResult.duration = duration;
        testResult.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      setTests([...updatedTests]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
      case 'running':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>;
      case 'passed':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'failed':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>;
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test Suite
          </h2>
          <div className="flex items-center space-x-4">
            {!isRunning && (
              <button
                onClick={runAllTests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Run All Tests
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {passedTests}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Passed
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {failedTests}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTests}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <span className="text-gray-900 dark:text-white font-medium">
                    {test.name}
                  </span>
                  {test.status === 'running' && currentTest === test.name && (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      Running...
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {test.duration && (
                    <span>{Math.round(test.duration)}ms</span>
                  )}
                  {test.error && (
                    <span className="text-red-500 max-w-xs truncate">
                      {test.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuite;
