#!/usr/bin/env node

/**
 * TestSprite Supabase Integration Test Runner
 * 
 * This script runs comprehensive tests against your REAL Supabase infrastructure:
 * - Real Supabase database
 * - Real Supabase storage
 * - Real Supabase authentication
 * - Real API endpoints
 * - No mocks, no fake data
 * 
 * Usage: node scripts/run-testsprite-tests.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`${colors.red}❌ Missing Supabase environment variables!${colors.reset}`);
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility functions
const log = (message, color = colors.white) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logTest = (name, status, details = '', error = '') => {
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '🔄';
  const color = status === 'passed' ? colors.green : status === 'failed' ? colors.red : colors.yellow;
  
  log(`${icon} ${name}`, color);
  if (details) log(`   ${details}`, colors.cyan);
  if (error) log(`   Error: ${error}`, colors.red);
  
  testResults.total++;
  if (status === 'passed') testResults.passed++;
  if (status === 'failed') testResults.failed++;
  
  testResults.details.push({ name, status, details, error });
};

const runTest = async (name, testFunction) => {
  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    logTest(name, 'passed', `Completed in ${duration}ms`);
    return result;
  } catch (error) {
    logTest(name, 'failed', '', error.message);
    return null;
  }
};

// Test Suite
const testSuite = [
  // Supabase Core Tests
  {
    name: 'Supabase Connection',
    test: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(`Connection failed: ${error.message}`);
      return data;
    }
  },
  
  {
    name: 'Database Schema Access',
    test: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('count')
        .limit(1);
      if (error) throw new Error(`Schema access failed: ${error.message}`);
      return data;
    }
  },
  
  {
    name: 'Storage Bucket Access',
    test: async () => {
      const { data, error } = await supabase.storage
        .from('documents')
        .list('', { limit: 1 });
      if (error) throw new Error(`Storage access failed: ${error.message}`);
      return data;
    }
  },
  
  {
    name: 'User Authentication Check',
    test: async () => {
      const { data, error } = await supabase.auth.getUser();
      
      // If no user is logged in, this is expected behavior
      if (error && error.message === 'Auth session missing!') {
        return { message: 'Auth system working (no active session as expected)' };
      }
      
      if (error && error.message !== 'Invalid JWT') {
        throw new Error(`Auth check failed: ${error.message}`);
      }
      return data || { message: 'Auth system accessible' };
    }
  },
  
  // Supabase API Tests
  {
    name: 'Supabase REST API',
    test: async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`);
      }
      return response;
    }
  },
  
  {
    name: 'Supabase Auth API',
    test: async () => {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      // Auth API might return 401 for unauthenticated requests, which is expected
      if (response.status === 401) {
        return { status: 401, message: 'Auth API accessible (unauthorized as expected)' };
      }
      
      if (!response.ok) {
        throw new Error(`Auth API response: ${response.status} ${response.statusText}`);
      }
      return response;
    }
  },
  
  // Performance Tests
  {
    name: 'Database Query Performance',
    test: async () => {
      const startTime = Date.now();
      await supabase.from('documents').select('count').limit(1);
      const duration = Date.now() - startTime;
      
      if (duration > 5000) {
        throw new Error(`Query too slow: ${duration}ms`);
      }
      return duration;
    }
  },
  
  {
    name: 'Storage List Performance',
    test: async () => {
      const startTime = Date.now();
      await supabase.storage.from('documents').list('', { limit: 1 });
      const duration = Date.now() - startTime;
      
      if (duration > 3000) {
        throw new Error(`Storage operation too slow: ${duration}ms`);
      }
      return duration;
    }
  },
  
  {
    name: 'Auth Session Performance',
    test: async () => {
      const startTime = Date.now();
      await supabase.auth.getSession();
      const duration = Date.now() - startTime;
      
      if (duration > 2000) {
        throw new Error(`Auth session check too slow: ${duration}ms`);
      }
      return duration;
    }
  }
];

// Main test runner
const runAllTests = async () => {
  console.clear();
  log('🧪 TestSprite Supabase Integration Test Suite', colors.bright + colors.blue);
  log('==============================================', colors.blue);
  log('Testing REAL Supabase infrastructure - No mocks!', colors.yellow);
  log('');
  
  log('🔧 Environment Check:', colors.bright + colors.cyan);
  log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`, supabaseUrl ? colors.green : colors.red);
  log(`   Supabase Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`, supabaseAnonKey ? colors.green : colors.red);
  log('');
  
  log('🚀 Starting Supabase Integration Tests...', colors.bright + colors.green);
  log('');
  
  // Run all tests
  for (const test of testSuite) {
    await runTest(test.name, test.test);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Results summary
  log('');
  log('📊 Test Results Summary:', colors.bright + colors.magenta);
  log('========================', colors.magenta);
  
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  
  log(`   Total Tests: ${testResults.total}`, colors.white);
  log(`   Passed: ${testResults.passed}`, colors.green);
  log(`   Failed: ${testResults.failed}`, colors.red);
  log(`   Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);
  
  log('');
  
  if (testResults.failed > 0) {
    log('❌ Failed Tests:', colors.bright + colors.red);
    testResults.details
      .filter(t => t.status === 'failed')
      .forEach(test => {
        log(`   • ${test.name}: ${test.error}`, colors.red);
      });
    
    log('');
    log('🔧 Recommendations:', colors.bright + colors.yellow);
    log('   • Check your Supabase environment variables', colors.yellow);
    log('   • Verify Supabase project configuration', colors.yellow);
    log('   • Check network connectivity to Supabase', colors.yellow);
    log('   • Verify database and storage permissions', colors.yellow);
    log('   • Check Supabase project status', colors.yellow);
  } else {
    log('🎉 All tests passed! Your Supabase infrastructure is working perfectly!', colors.bright + colors.green);
  }
  
  log('');
  log('🔗 Access TestSprite UI:', colors.bright + colors.cyan);
  log('   Start your dev server: npm start', colors.cyan);
  log('   Navigate to: http://localhost:3000/testsprite', colors.cyan);
  
  return testResults.failed === 0;
};

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Test runner failed: ${error.message}`, colors.red);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
