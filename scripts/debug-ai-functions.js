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

console.log('🔍 Debugging AI Functions...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

async function debugTranslationFunction() {
  console.log('🌐 Debugging Translation Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: {
        text: 'Hello, how are you today?',
        targetLanguage: 'es',
        sourceLanguage: 'en'
      }
    });

    if (error) {
      console.log('❌ Translation function error:');
      console.log('   Error object:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Translation successful!');
    console.log('   Data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Translation function exception:');
    console.log('   Exception:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

async function debugDocumentProcessingFunction() {
  console.log('\n📄 Debugging Document Processing Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        fileUrl: 'https://via.placeholder.com/300x200/000000/FFFFFF?text=Test+Document',
        fileName: 'test-document.jpg',
        fileType: 'image/jpeg',
        userId: 'test-user'
      }
    });

    if (error) {
      console.log('❌ Document processing function error:');
      console.log('   Error object:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Document processing successful!');
    console.log('   Data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Document processing function exception:');
    console.log('   Exception:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

async function checkFunctionStatus() {
  console.log('🔍 Checking Function Status...');
  
  try {
    // Try to get function info
    const response = await fetch(`${supabaseUrl}/functions/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      }
    });
    
    console.log('   Function endpoint response status:', response.status);
    console.log('   Function endpoint response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const text = await response.text();
      console.log('   Function endpoint response body:', text);
    }
  } catch (error) {
    console.log('   Function endpoint check failed:', error.message);
  }
}

async function runDebugTests() {
  console.log('🚀 Starting AI Function Debug Tests...\n');
  
  await checkFunctionStatus();
  
  const results = {
    translation: await debugTranslationFunction(),
    documentProcessing: await debugDocumentProcessingFunction()
  };

  console.log('\n📊 Debug Results Summary:');
  console.log('==========================');
  console.log(`🌐 Translation Function: ${results.translation ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`📄 Document Processing: ${results.documentProcessing ? '✅ WORKING' : '❌ FAILED'}`);
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Check if Edge Functions are deployed in Supabase Dashboard');
  console.log('2. Verify environment variables are set in Supabase Dashboard → Settings → Edge Functions');
  console.log('3. Check function logs in Supabase Dashboard → Edge Functions → Logs');
  console.log('4. Ensure your Google API keys have proper permissions');
}

// Run the debug tests
runDebugTests().catch(console.error);
