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

console.log('🧹 Orphaned Files Cleanup Tool\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey.substring(0, 20) + '...\n');

async function cleanupOrphanedFiles() {
  try {
    console.log('🚀 Starting orphaned files cleanup...\n');
    
    // Get all documents from database
    console.log('📊 Fetching all documents from database...');
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('id, name, url, user_id, created_at')
      .order('created_at', { ascending: false });

    if (dbError) {
      throw new Error(`Database fetch error: ${dbError.message}`);
    }

    console.log(`✅ Found ${documents.length} documents in database\n`);

    // Get all files from storage
    console.log('📁 Fetching all files from storage...');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('documents')
      .list('', { limit: 1000 });

    if (storageError) {
      throw new Error(`Storage fetch error: ${storageError.message}`);
    }

    console.log(`✅ Found ${storageFiles.length} files in storage\n`);

    // Find orphaned database records (records without storage files)
    console.log('🔍 Checking for orphaned database records...');
    const orphanedRecords = [];
    
    for (const document of documents) {
      try {
        // Extract file path from URL
        let filePath;
        if (document.url.includes('/storage/v1/object/public/documents/')) {
          filePath = document.url.split('/storage/v1/object/public/documents/')[1];
        } else if (document.url.includes('/object/public/documents/')) {
          filePath = document.url.split('/object/public/documents/')[1];
        } else {
          filePath = `${document.user_id}/${document.name}`;
        }

        // Check if file exists in storage
        const fileName = filePath.split('/').pop();
        const userFolder = filePath.split('/')[0];
        
        const { data: fileExists, error: checkError } = await supabase.storage
          .from('documents')
          .list(userFolder, {
            limit: 1000,
            search: fileName
          });

        if (checkError) {
          console.warn(`⚠️ Error checking file existence for ${document.name}:`, checkError.message);
          continue;
        }

        // If file doesn't exist in storage, mark as orphaned
        if (!fileExists || fileExists.length === 0) {
          orphanedRecords.push({
            id: document.id,
            name: document.name,
            user_id: document.user_id,
            reason: 'Storage file missing'
          });
        }
      } catch (error) {
        console.warn(`⚠️ Error processing document ${document.name}:`, error.message);
      }
    }

    console.log(`📋 Found ${orphanedRecords.length} orphaned database records\n`);

    // Find orphaned storage files (files without database records)
    console.log('🔍 Checking for orphaned storage files...');
    const orphanedStorageFiles = [];
    
    for (const file of storageFiles) {
      // Check if this file has a corresponding database record
      const hasRecord = documents.some(doc => doc.name === file.name);
      
      if (!hasRecord) {
        orphanedStorageFiles.push({
          name: file.name,
          size: file.metadata?.size || 'Unknown',
          reason: 'No database record'
        });
      }
    }

    console.log(`📋 Found ${orphanedStorageFiles.length} orphaned storage files\n`);

    // Display orphaned records
    if (orphanedRecords.length > 0) {
      console.log('🗑️ Orphaned Database Records:');
      console.log('==============================');
      orphanedRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.name} (User: ${record.user_id})`);
        console.log(`   Reason: ${record.reason}`);
        console.log(`   ID: ${record.id}`);
        console.log('');
      });
    }

    // Display orphaned storage files
    if (orphanedStorageFiles.length > 0) {
      console.log('🗑️ Orphaned Storage Files:');
      console.log('===========================');
      orphanedStorageFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Size: ${file.size} bytes`);
        console.log(`   Reason: ${file.reason}`);
        console.log('');
      });
    }

    // Ask user if they want to clean up
    if (orphanedRecords.length === 0 && orphanedStorageFiles.length === 0) {
      console.log('🎉 No orphaned files found! Everything is in sync.');
      return;
    }

    console.log('⚠️ WARNING: This will permanently delete the orphaned files!');
    console.log('💡 You can also run individual cleanup commands:');
    console.log('   - For orphaned database records: npm run cleanup:db');
    console.log('   - For orphaned storage files: npm run cleanup:storage');
    console.log('   - For both: npm run cleanup:all');

    // For now, just show what would be cleaned up
    console.log('\n📋 Summary of what would be cleaned up:');
    console.log(`   Database records: ${orphanedRecords.length}`);
    console.log(`   Storage files: ${orphanedStorageFiles.length}`);
    console.log('\n🔧 To actually clean up, run the cleanup commands above.');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedFiles().catch(console.error);
