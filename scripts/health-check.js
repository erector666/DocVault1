const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'https://docvault.netlify.app';
const TIMEOUT = 10000; // 10 seconds

const healthChecks = [
  {
    name: 'Homepage Load',
    url: BASE_URL,
    expectedStatus: 200
  },
  {
    name: 'Static Assets',
    url: `${BASE_URL}/static/css/main.css`,
    expectedStatus: 200
  },
  {
    name: 'Service Worker',
    url: `${BASE_URL}/sw.js`,
    expectedStatus: 200
  },
  {
    name: 'Manifest',
    url: `${BASE_URL}/manifest.json`,
    expectedStatus: 200
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          contentLength: data.length,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runHealthCheck(check) {
  console.log(`\n🔍 Checking: ${check.name}`);
  console.log(`   URL: ${check.url}`);
  
  try {
    const result = await makeRequest(check.url);
    
    if (result.statusCode === check.expectedStatus) {
      console.log(`   ✅ Status: ${result.statusCode} (${result.responseTime}ms)`);
      return { ...check, passed: true, ...result };
    } else {
      console.log(`   ❌ Status: ${result.statusCode} (expected ${check.expectedStatus})`);
      return { ...check, passed: false, ...result };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { ...check, passed: false, error: error.message };
  }
}

async function runAllHealthChecks() {
  console.log(`🏥 DocVault Health Check`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Timeout: ${TIMEOUT}ms`);
  console.log('='.repeat(50));

  const results = [];
  
  for (const check of healthChecks) {
    const result = await runHealthCheck(check);
    results.push(result);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Health Check Summary');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`✅ Passed: ${passed}/${total} (${passRate}%)`);
  
  if (passed === total) {
    console.log('🎉 All health checks passed!');
    console.log('\n📈 Performance Summary:');
    
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    
    const totalSize = results
      .filter(r => r.contentLength)
      .reduce((sum, r) => sum + r.contentLength, 0);
    
    console.log(`   Total Content Size: ${(totalSize / 1024).toFixed(1)}KB`);
    
    process.exit(0);
  } else {
    console.log('❌ Some health checks failed!');
    
    const failed = results.filter(r => !r.passed);
    console.log('\n🚨 Failed Checks:');
    failed.forEach(check => {
      console.log(`   - ${check.name}: ${check.error || `Status ${check.statusCode}`}`);
    });
    
    process.exit(1);
  }
}

// Additional checks for production environment
async function runProductionChecks() {
  if (!BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
    console.log('\n🔒 Running Production-Specific Checks...');
    
    // Check HTTPS
    if (!BASE_URL.startsWith('https:')) {
      console.log('❌ Production site should use HTTPS');
      return false;
    }
    
    // Check security headers
    try {
      const result = await makeRequest(BASE_URL);
      const headers = result.headers;
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security'
      ];
      
      let securityScore = 0;
      securityHeaders.forEach(header => {
        if (headers[header]) {
          console.log(`   ✅ ${header}: ${headers[header]}`);
          securityScore++;
        } else {
          console.log(`   ⚠️  Missing: ${header}`);
        }
      });
      
      console.log(`   Security Score: ${securityScore}/${securityHeaders.length}`);
      return securityScore === securityHeaders.length;
    } catch (error) {
      console.log(`   ❌ Security check failed: ${error.message}`);
      return false;
    }
  }
  return true;
}

// Main execution
async function main() {
  try {
    await runAllHealthChecks();
    
    if (process.env.NODE_ENV === 'production') {
      const productionHealthy = await runProductionChecks();
      if (!productionHealthy) {
        console.log('\n⚠️  Production checks revealed issues');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  }
}

main();
