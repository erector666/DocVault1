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

console.log('🔧 Fixing Database Schema...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...\n');

async function fixDatabaseSchema() {
  console.log('🚀 Starting database schema fix...\n');
  
  try {
    // Check current table structure
    console.log('🔍 Checking current documents table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error accessing documents table:', tableError.message);
      return false;
    }
    
    console.log('✅ Documents table accessible');
    
    // Try to insert a test record to see what columns are missing
    console.log('\n🔍 Testing table structure with sample data...');
    
    const testData = {
      name: 'test-schema-check.txt',
      type: 'text/plain',
      size: 0,
      url: 'https://test.com/test.txt',
      user_id: 'schema-test-user',
      category: 'test',
      ai_analysis: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const { data: testInsert, error: insertError } = await supabase
      .from('documents')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      
      // Check if it's a missing column error
      if (insertError.message.includes('confidence') || 
          insertError.message.includes('keywords') || 
          insertError.message.includes('document_type') || 
          insertError.message.includes('language')) {
        
        console.log('\n🔧 Missing columns detected. You need to add these columns to your database:');
        console.log('   - confidence (numeric)');
        console.log('   - keywords (text array)');
        console.log('   - document_type (text)');
        console.log('   - language (text)');
        
        console.log('\n📋 SQL Commands to run in Supabase SQL Editor:');
        console.log('==============================================');
        console.log(`
-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Update existing records to have default values
UPDATE documents 
SET 
  confidence = COALESCE(confidence, 0),
  keywords = COALESCE(keywords, '{}'),
  language = COALESCE(language, 'en')
WHERE confidence IS NULL OR keywords IS NULL OR language IS NULL;
        `);
        
        return false;
      }
    } else {
      console.log('✅ Schema test successful - all columns exist');
      
      // Clean up test record
      await supabase
        .from('documents')
        .delete()
        .eq('id', testInsert.id);
      
      console.log('🧹 Test record cleaned up');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Schema fix error:', error.message);
    return false;
  }
}

async function runSchemaFix() {
  console.log('🔧 Database Schema Fix Tool\n');
  
  const success = await fixDatabaseSchema();
  
  if (success) {
    console.log('\n🎉 Database schema is correct!');
    console.log('✅ All required columns exist');
    console.log('🚀 Your upload functionality should work now');
  } else {
    console.log('\n⚠️ Database schema needs fixing');
    console.log('💡 Run the SQL commands above in your Supabase SQL Editor');
    console.log('🔗 Go to: Supabase Dashboard → SQL Editor');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Run the SQL commands above');
  console.log('3. Test document upload again');
}

// Run the schema fix
runSchemaFix().catch(console.error);
