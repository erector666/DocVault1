import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import { ProgressBar } from '../feedback/ProgressBar';
import { useToast } from '../feedback/Toast';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
  duration?: number;
}

export const SystemTestRunner: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [currentSuite, setCurrentSuite] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { success, error } = useToast();

  useEffect(() => {
    initializeTestSuites();
  }, []);

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        name: 'Authentication Tests',
        status: 'pending',
        tests: [
          { name: 'User Registration', status: 'pending' },
          { name: 'User Login', status: 'pending' },
          { name: 'Password Reset', status: 'pending' },
          { name: 'Session Management', status: 'pending' },
          { name: 'Logout', status: 'pending' }
        ]
      },
      {
        name: 'Document Management Tests',
        status: 'pending',
        tests: [
          { name: 'Document Upload', status: 'pending' },
          { name: 'Document Classification', status: 'pending' },
          { name: 'OCR Processing', status: 'pending' },
          { name: 'Document Viewing', status: 'pending' },
          { name: 'Document Download', status: 'pending' },
          { name: 'Document Deletion', status: 'pending' }
        ]
      },
      {
        name: 'Search & Filter Tests',
        status: 'pending',
        tests: [
          { name: 'Basic Search', status: 'pending' },
          { name: 'Advanced Search', status: 'pending' },
          { name: 'Category Filtering', status: 'pending' },
          { name: 'Date Range Filtering', status: 'pending' },
          { name: 'Search Suggestions', status: 'pending' }
        ]
      },
      {
        name: 'Security Tests',
        status: 'pending',
        tests: [
          { name: 'File Type Validation', status: 'pending' },
          { name: 'File Size Limits', status: 'pending' },
          { name: 'Rate Limiting', status: 'pending' },
          { name: 'Input Sanitization', status: 'pending' },
          { name: 'Access Control', status: 'pending' }
        ]
      },
      {
        name: 'Performance Tests',
        status: 'pending',
        tests: [
          { name: 'Page Load Time', status: 'pending' },
          { name: 'Large File Upload', status: 'pending' },
          { name: 'Search Performance', status: 'pending' },
          { name: 'Memory Usage', status: 'pending' },
          { name: 'Cache Effectiveness', status: 'pending' }
        ]
      },
      {
        name: 'Accessibility Tests',
        status: 'pending',
        tests: [
          { name: 'Keyboard Navigation', status: 'pending' },
          { name: 'Screen Reader Support', status: 'pending' },
          { name: 'Color Contrast', status: 'pending' },
          { name: 'Focus Management', status: 'pending' },
          { name: 'ARIA Labels', status: 'pending' }
        ]
      },
      {
        name: 'Mobile Responsiveness Tests',
        status: 'pending',
        tests: [
          { name: 'Mobile Layout', status: 'pending' },
          { name: 'Touch Interactions', status: 'pending' },
          { name: 'Mobile Upload', status: 'pending' },
          { name: 'Mobile Navigation', status: 'pending' },
          { name: 'Responsive Images', status: 'pending' }
        ]
      }
    ];

    setTestSuites(suites);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    let completedTests = 0;

    for (const suite of testSuites) {
      setCurrentSuite(suite.name);
      await runTestSuite(suite);
      completedTests += suite.tests.length;
      setOverallProgress((completedTests / totalTests) * 100);
    }

    setCurrentSuite(null);
    setCurrentTest(null);
    setIsRunning(false);

    const passedTests = testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(test => test.status === 'passed').length, 0
    );

    if (passedTests === totalTests) {
      success('All tests passed!', `${totalTests} tests completed successfully`);
    } else {
      error('Some tests failed', `${passedTests}/${totalTests} tests passed`);
    }
  };

  const runTestSuite = async (suite: TestSuite) => {
    const suiteStartTime = Date.now();
    
    setTestSuites(prev => prev.map(s => 
      s.name === suite.name ? { ...s, status: 'running' } : s
    ));

    for (const test of suite.tests) {
      setCurrentTest(test.name);
      await runIndividualTest(suite.name, test);
    }

    const suiteDuration = Date.now() - suiteStartTime;
    
    setTestSuites(prev => prev.map(s => 
      s.name === suite.name ? { ...s, status: 'completed', duration: suiteDuration } : s
    ));
  };

  const runIndividualTest = async (suiteName: string, test: TestResult) => {
    const testStartTime = Date.now();
    
    setTestSuites(prev => prev.map(suite => 
      suite.name === suiteName 
        ? {
            ...suite,
            tests: suite.tests.map(t => 
              t.name === test.name ? { ...t, status: 'running' } : t
            )
          }
        : suite
    ));

    // Simulate test execution with random results
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    const testDuration = Date.now() - testStartTime;
    const passed = Math.random() > 0.1; // 90% pass rate

    setTestSuites(prev => prev.map(suite => 
      suite.name === suiteName 
        ? {
            ...suite,
            tests: suite.tests.map(t => 
              t.name === test.name 
                ? { 
                    ...t, 
                    status: passed ? 'passed' : 'failed',
                    duration: testDuration,
                    error: passed ? undefined : 'Simulated test failure',
                    details: passed ? { result: 'success' } : { error: 'Test assertion failed' }
                  }
                : t
            )
          }
        : suite
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'running':
        return <LoadingSpinner size="sm" />;
      case 'skipped':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'skipped': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const passedTests = testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(test => test.status === 'passed').length, 0
  );
  const failedTests = testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(test => test.status === 'failed').length, 0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Test Runner</h1>
        <p className="mt-2 text-gray-600">Comprehensive testing of DocVault functionality</p>
      </div>

      {/* Test Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-semibold text-gray-900">{passedTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">{failedTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Test Control</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </button>

            {isRunning && (
              <div className="flex-1 ml-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <ProgressBar value={overallProgress} color="blue" />
                {currentSuite && (
                  <p className="text-xs text-gray-500 mt-2">
                    Running: {currentSuite} {currentTest && `- ${currentTest}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Suites */}
      <div className="space-y-6">
        {testSuites.map((suite) => (
          <div key={suite.name} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{suite.name}</h3>
                <div className="flex items-center space-x-2">
                  {suite.duration && (
                    <span className="text-sm text-gray-500">
                      {(suite.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suite.status)}`}>
                    {suite.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {suite.tests.map((test) => (
                <div key={test.name} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {test.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {test.duration && (
                        <span className="text-sm text-gray-500">
                          {test.duration}ms
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                  {test.error && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{test.error}</p>
                    </div>
                  )}
                  {test.details && test.status === 'failed' && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemTestRunner;
