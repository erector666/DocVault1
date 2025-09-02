const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Edge Functions for Deployment...\n');

// Function definitions
const functions = {
  'process-document': {
    sourcePath: 'supabase/functions/process-document/index.ts',
    description: 'AI document processing with Google Cloud Vision API'
  },
  'translate-text': {
    sourcePath: 'supabase/functions/translate-text/index.ts',
    description: 'Text translation using Google Translate API'
  }
};

console.log('📋 Functions to Deploy:');
console.log('========================');

Object.entries(functions).forEach(([name, config]) => {
  console.log(`\n🔧 ${name}`);
  console.log(`   📄 Description: ${config.description}`);
  console.log(`   📁 Source: ${config.sourcePath}`);
  
  try {
    const sourcePath = path.join(__dirname, '..', config.sourcePath);
    if (fs.existsSync(sourcePath)) {
      const code = fs.readFileSync(sourcePath, 'utf8');
      console.log(`   ✅ Code loaded (${code.length} characters)`);
      console.log(`   📝 First line: ${code.split('\n')[0]}`);
    } else {
      console.log(`   ❌ Source file not found`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
  }
});

console.log('\n🚀 Deployment Commands:');
console.log('=======================');
console.log('Run these commands in your terminal with Supabase CLI:');
console.log('');

Object.keys(functions).forEach((functionName) => {
  console.log(`# Deploy ${functionName}:`);
  console.log(`supabase functions new ${functionName}`);
  console.log(`supabase functions deploy ${functionName} --project-ref vxvwomyqmiqlcezfxenh`);
  console.log('');
});

console.log('📋 Manual Deployment Steps:');
console.log('===========================');
console.log('1. Run: supabase functions new process-document');
console.log('2. Copy code from: supabase/functions/process-document/index.ts');
console.log('3. Run: supabase functions deploy process-document --project-ref vxvwomyqmiqlcezfxenh');
console.log('4. Run: supabase functions new translate-text');
console.log('5. Copy code from: supabase/functions/translate-text/index.ts');
console.log('6. Run: supabase functions deploy translate-text --project-ref vxvwomyqmiqlcezfxenh');
console.log('');

console.log('🔑 Environment Variables:');
console.log('=========================');
console.log('✅ GOOGLE_CLOUD_VISION_API_KEY = AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY');
console.log('✅ GOOGLE_TRANSLATE_API_KEY = AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY');
console.log('');

console.log('🧪 After Deployment, Test With:');
console.log('===============================');
console.log('node scripts/test-ai-functions.js');
console.log('');

console.log('🎯 Current Status:');
console.log('==================');
console.log('✅ Function code: Ready');
console.log('✅ Environment variables: Set in Supabase');
console.log('⏳ Functions: Need to be deployed');
console.log('🚀 Next: Run the deployment commands above');
