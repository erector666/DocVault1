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

console.log('🔍 Verifying Database Schema...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...\n');

async function verifySchema() {
  console.log('🚀 Starting schema verification...\n');
  
  try {
    // Check if we can access the documents table
    console.log('🔍 Checking documents table access...');
    
    const { data: documents, error: tableError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error accessing documents table:', tableError.message);
      return false;
    }
    
    console.log('✅ Documents table accessible');
    
    // Try to get table information by attempting to select specific columns
    console.log('\n🔍 Testing column access...');
    
    const requiredColumns = [
      'confidence',
      'keywords', 
      'document_type',
      'language',
      'metadata'
    ];
    
    let missingColumns = [];
    
    for (const column of requiredColumns) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes(`column "${column}" does not exist`)) {
          missingColumns.push(column);
          console.log(`❌ Column '${column}' missing`);
        } else {
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (error) {
        if (error.message.includes(`column "${column}" does not exist`)) {
          missingColumns.push(column);
          console.log(`❌ Column '${column}' missing`);
        } else {
          console.log(`⚠️ Error checking column '${column}':`, error.message);
        }
      }
    }
    
    console.log('\n📊 Schema Verification Results:');
    console.log('===============================');
    
    if (missingColumns.length === 0) {
      console.log('🎉 All required columns exist!');
      console.log('✅ Database schema is correct');
      console.log('🚀 Document upload should work now');
      return true;
    } else {
      console.log('⚠️ Missing columns detected:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      
      console.log('\n🔧 You need to run this SQL in Supabase SQL Editor:');
      console.log('==================================================');
      console.log(`
 -- Add missing columns to documents table
 ALTER TABLE documents 
 ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
 ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS document_type TEXT,
 ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
 ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

 -- Update existing records to have default values
 UPDATE documents 
 SET 
   confidence = COALESCE(confidence, 0),
   keywords = COALESCE(keywords, '{}'),
   language = COALESCE(language, 'en'),
   metadata = COALESCE(metadata, '{}')
 WHERE confidence IS NULL OR keywords IS NULL OR language IS NULL OR metadata IS NULL;
       `);
      
      return false;
    }
    
  } catch (error) {
    console.log('❌ Schema verification error:', error.message);
    return false;
  }
}

async function runVerification() {
  console.log('🔍 Database Schema Verification Tool\n');
  
  const success = await verifySchema();
  
  if (success) {
    console.log('\n🎉 Schema verification successful!');
    console.log('✅ All required columns exist');
    console.log('🚀 Try uploading a document now');
  } else {
    console.log('\n⚠️ Schema verification failed');
    console.log('💡 Run the SQL commands above in your Supabase SQL Editor');
    console.log('🔗 Go to: Supabase Dashboard → SQL Editor');
  }
  
  console.log('\n📋 Next Steps:');
  if (success) {
    console.log('1. Try uploading a document in your app');
    console.log('2. AI processing should work automatically');
  } else {
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL commands above');
    console.log('3. Run this verification script again');
  }
}

// Run the verification
runVerification().catch(console.error);
