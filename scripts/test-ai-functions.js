const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file for REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing AI Functions with Supabase Edge Functions...\n');

async function testTranslationFunction() {
  console.log('🌐 Testing Translation Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: {
        text: 'Hello, how are you today?',
        targetLanguage: 'es',
        sourceLanguage: 'en'
      }
    });

    if (error) {
      console.log('❌ Translation function error:', error.message);
      return false;
    }

    console.log('✅ Translation successful!');
    console.log('   Original: Hello, how are you today?');
    console.log('   Translated:', data.translatedText);
    console.log('   Detected Language:', data.detectedSourceLanguage);
    console.log('   Confidence:', data.confidence);
    return true;
  } catch (error) {
    console.log('❌ Translation function failed:', error.message);
    return false;
  }
}

async function testDocumentProcessingFunction() {
  console.log('\n📄 Testing Document Processing Function...');
  
  try {
    // Test with a placeholder image URL
    const testImageUrl = 'https://via.placeholder.com/300x200/000000/FFFFFF?text=Test+Document';
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        fileUrl: testImageUrl,
        fileName: 'test-document.jpg',
        fileType: 'image/jpeg',
        userId: 'test-user'
      }
    });

    if (error) {
      console.log('❌ Document processing function error:', error.message);
      return false;
    }

    console.log('✅ Document processing successful!');
    console.log('   Extracted Text:', data.extractedText ? data.extractedText.substring(0, 100) + '...' : 'None');
    console.log('   Category:', data.classification.category);
    console.log('   Document Type:', data.classification.documentType);
    console.log('   Keywords:', data.classification.keywords.join(', '));
    console.log('   Confidence:', data.classification.confidence);
    return true;
  } catch (error) {
    console.log('❌ Document processing function failed:', error.message);
    return false;
  }
}

async function testUnsupportedFileType() {
  console.log('\n📝 Testing Unsupported File Type Handling...');
  
  try {
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        fileUrl: 'test.txt',
        fileName: 'test-document.txt',
        fileType: 'text/plain',
        userId: 'test-user'
      }
    });

    if (error) {
      console.log('❌ Function call failed:', error.message);
      return false;
    }

    console.log('✅ Unsupported file type handled correctly!');
    console.log('   Category:', data.classification.category);
    console.log('   Document Type:', data.classification.documentType);
    return true;
  } catch (error) {
    console.log('❌ Unsupported file type test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Function Tests...\n');
  
  const results = {
    translation: await testTranslationFunction(),
    documentProcessing: await testDocumentProcessingFunction(),
    unsupportedFileType: await testUnsupportedFileType()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`🌐 Translation Function: ${results.translation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📄 Document Processing: ${results.documentProcessing ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📝 Unsupported Files: ${results.unsupportedFileType ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All AI functions are working perfectly!');
    console.log('🚀 Your AI functionality is now operational!');
  } else {
    console.log('⚠️ Some tests failed. Check the error messages above.');
    console.log('💡 Make sure your Supabase Edge Functions are properly deployed.');
  }
}

// Run the tests
runAllTests().catch(console.error);
