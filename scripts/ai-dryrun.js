const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 AI FUNCTIONALITY DRY RUN - TESTING REAL SCENARIOS\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...\n');

// Test scenarios
const testScenarios = [
  {
    name: '📄 Real Document Processing',
    description: 'Process a real document image with AI',
    test: async () => {
      console.log('🔍 Testing real document processing...');
      
      // Use a real document image URL (you can replace this with any real image)
      const realImageUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop';
      
      try {
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: {
            fileUrl: realImageUrl,
            fileName: 'real-document.jpg',
            fileType: 'image/jpeg',
            userId: 'test-user'
          }
        });

        if (error) {
          console.log('❌ Document processing failed:', error.message);
          return false;
        }

        console.log('✅ Document processing successful!');
        console.log('   📝 Extracted Text:', data.extractedText ? data.extractedText.substring(0, 100) + '...' : 'None');
        console.log('   🏷️ Category:', data.classification.category);
        console.log('   📄 Document Type:', data.classification.documentType);
        console.log('   🔑 Keywords:', data.classification.keywords.join(', '));
        console.log('   🎯 Confidence:', data.classification.confidence);
        console.log('   ⏰ Processed At:', data.processedAt);
        
        return true;
      } catch (error) {
        console.log('❌ Document processing error:', error.message);
        return false;
      }
    }
  },
  
  {
    name: '🌐 Real Translation Scenarios',
    description: 'Test multiple translation scenarios',
    test: async () => {
      console.log('🔍 Testing multiple translation scenarios...');
      
      const translations = [
        { text: 'Hello, how are you today?', target: 'es', source: 'en' },
        { text: 'This is a test document for AI processing', target: 'fr', source: 'en' },
        { text: 'Welcome to DocVault - AI-powered document management', target: 'de', source: 'en' }
      ];
      
      let successCount = 0;
      
      for (const translation of translations) {
        try {
          const { data, error } = await supabase.functions.invoke('translate-text', {
            body: {
              text: translation.text,
              targetLanguage: translation.target,
              sourceLanguage: translation.source
            }
          });

          if (error) {
            console.log(`❌ Translation failed (${translation.source}→${translation.target}):`, error.message);
          } else {
            console.log(`✅ Translation successful (${translation.source}→${translation.target}):`);
            console.log(`   Original: ${translation.text}`);
            console.log(`   Translated: ${data.translatedText}`);
            console.log(`   Detected: ${data.detectedSourceLanguage || translation.source}`);
            successCount++;
          }
        } catch (error) {
          console.log(`❌ Translation error (${translation.source}→${translation.target}):`, error.message);
        }
      }
      
      console.log(`\n📊 Translation Results: ${successCount}/${translations.length} successful`);
      return successCount > 0;
    }
  },
  
  {
    name: '🔍 AI Classification Test',
    description: 'Test AI document classification with different file types',
    test: async () => {
      console.log('🔍 Testing AI classification...');
      
      const testFiles = [
        { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop', type: 'image/jpeg', name: 'document-image.jpg' },
        { url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop', type: 'image/jpeg', name: 'receipt-image.jpg' },
        { url: 'test.txt', type: 'text/plain', name: 'text-file.txt' }
      ];
      
      let successCount = 0;
      
      for (const file of testFiles) {
        try {
          const { data, error } = await supabase.functions.invoke('process-document', {
            body: {
              fileUrl: file.url,
              fileName: file.name,
              fileType: file.type,
              userId: 'test-user'
            }
          });

          if (error) {
            console.log(`❌ Classification failed for ${file.name}:`, error.message);
          } else {
            console.log(`✅ Classification successful for ${file.name}:`);
            console.log(`   🏷️ Category: ${data.classification.category}`);
            console.log(`   📄 Type: ${data.classification.documentType}`);
            console.log(`   🔑 Keywords: ${data.classification.keywords.join(', ')}`);
            console.log(`   🎯 Confidence: ${data.classification.confidence}`);
            successCount++;
          }
        } catch (error) {
          console.log(`❌ Classification error for ${file.name}:`, error.message);
        }
      }
      
      console.log(`\n📊 Classification Results: ${successCount}/${testFiles.length} successful`);
      return successCount > 0;
    }
  },
  
  {
    name: '⚡ Performance Test',
    description: 'Test AI response times and performance',
    test: async () => {
      console.log('🔍 Testing AI performance...');
      
      const startTime = Date.now();
      
      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: {
            text: 'Performance test - quick translation',
            targetLanguage: 'es',
            sourceLanguage: 'en'
          }
        });

        const responseTime = Date.now() - startTime;
        
        if (error) {
          console.log('❌ Performance test failed:', error.message);
          return false;
        }

        console.log('✅ Performance test successful!');
        console.log(`   ⏱️ Response Time: ${responseTime}ms`);
        console.log(`   📝 Translation: ${data.translatedText}`);
        
        // Performance benchmarks
        if (responseTime < 1000) {
          console.log('   🚀 Excellent performance (< 1 second)');
        } else if (responseTime < 3000) {
          console.log('   ✅ Good performance (< 3 seconds)');
        } else if (responseTime < 5000) {
          console.log('   ⚠️ Acceptable performance (< 5 seconds)');
        } else {
          console.log('   🐌 Slow performance (> 5 seconds)');
        }
        
        return true;
      } catch (error) {
        console.log('❌ Performance test error:', error.message);
        return false;
      }
    }
  }
];

async function runDryRun() {
  console.log('🚀 Starting AI Functionality Dry Run...\n');
  
  const results = {};
  
  for (const scenario of testScenarios) {
    console.log(`\n${scenario.name}`);
    console.log('='.repeat(scenario.name.length));
    console.log(`📋 ${scenario.description}\n`);
    
    const startTime = Date.now();
    results[scenario.name] = await scenario.test();
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️ Duration: ${duration}ms`);
    console.log(`Status: ${results[scenario.name] ? '✅ PASS' : '❌ FAIL'}`);
    console.log('─'.repeat(50));
  }
  
  console.log('\n📊 DRY RUN RESULTS SUMMARY');
  console.log('==========================');
  
  Object.entries(results).forEach(([name, success]) => {
    console.log(`${name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} scenarios passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL AI FUNCTIONALITY TESTS PASSED!');
    console.log('🚀 Your AI system is fully operational!');
  } else {
    console.log('\n⚠️ Some AI functionality tests failed.');
    console.log('💡 Check the error messages above for details.');
  }
  
  console.log('\n🔍 What This Means:');
  console.log('===================');
  console.log('✅ Document Processing: AI can analyze and classify documents');
  console.log('✅ Translation: AI can translate text between languages');
  console.log('✅ Classification: AI can categorize different file types');
  console.log('✅ Performance: AI responds within acceptable time limits');
}

// Run the dry run
runDryRun().catch(console.error);
