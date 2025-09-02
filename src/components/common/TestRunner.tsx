import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  duration?: number;
}

const TestRunner: React.FC = () => {
  const { translate: _ } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests: TestResult[] = [
      { name: 'Document Upload', status: 'pending' },
      { name: 'OCR Text Extraction', status: 'pending' },
      { name: 'AI Classification', status: 'pending' },
      { name: 'Document Translation', status: 'pending' },
      { name: 'Document Viewer', status: 'pending' },
      { name: 'Document Deletion', status: 'pending' },
      { name: 'Mobile Responsiveness', status: 'pending' },
    ];

    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock test results
      const test = { ...tests[i] };
      test.status = Math.random() > 0.2 ? 'pass' : 'fail';
      test.duration = Math.floor(Math.random() * 1000) + 100;
      
      if (test.status === 'fail') {
        test.message = `Test failed: Mock error for ${test.name}`;
      }

      setResults(prev => [...prev, test]);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <span className="text-green-500">✓</span>;
      case 'fail':
        return <span className="text-red-500">✗</span>;
      case 'pending':
        return <span className="text-yellow-500">⏳</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Test Suite
        </h2>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <span className="text-gray-900 dark:text-white">{result.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {result.duration && <span>{result.duration}ms</span>}
                {result.message && (
                  <span className="text-red-500 max-w-xs truncate">{result.message}</span>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Summary:</strong> {results.filter(r => r.status === 'pass').length} passed, {results.filter(r => r.status === 'fail').length} failed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
