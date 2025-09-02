import { supabase } from './supabase';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_size: number;
  created_at: string;
  created_by: string;
  change_description?: string;
  is_current: boolean;
}

/**
 * Create a new version of a document
 */
export const createDocumentVersion = async (
  documentId: string,
  file: File,
  userId: string,
  changeDescription?: string
): Promise<DocumentVersion> => {
  try {
    // Get current version number
    const { data: currentVersions, error: versionError } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versionError) {
      throw new Error(`Failed to get version info: ${versionError.message}`);
    }

    const nextVersion = currentVersions && currentVersions.length > 0 
      ? currentVersions[0].version_number + 1 
      : 1;

    // Upload new version file
    const fileName = `${Date.now()}-v${nextVersion}-${file.name}`;
    const filePath = `${userId}/versions/${documentId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Mark all previous versions as not current
    await supabase
      .from('document_versions')
      .update({ is_current: false })
      .eq('document_id', documentId);

    // Create version record
    const versionData = {
      document_id: documentId,
      version_number: nextVersion,
      file_path: filePath,
      file_size: file.size,
      created_by: userId,
      change_description: changeDescription,
      is_current: true
    };

    const { data: version, error: dbError } = await supabase
      .from('document_versions')
      .insert([versionData])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return version as DocumentVersion;
  } catch (error) {
    console.error('Error creating document version:', error);
    throw error;
  }
};

/**
 * Get all versions of a document
 */
export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
  const { data: versions, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to get versions: ${error.message}`);
  }

  return versions || [];
};

/**
 * Restore a specific version as current
 */
export const restoreDocumentVersion = async (
  documentId: string,
  versionId: string,
  userId: string
): Promise<void> => {
  try {
    // Mark all versions as not current
    await supabase
      .from('document_versions')
      .update({ is_current: false })
      .eq('document_id', documentId);

    // Mark selected version as current
    const { error } = await supabase
      .from('document_versions')
      .update({ is_current: true })
      .eq('id', versionId);

    if (error) {
      throw new Error(`Failed to restore version: ${error.message}`);
    }
  } catch (error) {
    console.error('Error restoring document version:', error);
    throw error;
  }
};

/**
 * Delete a specific version
 */
export const deleteDocumentVersion = async (versionId: string): Promise<void> => {
  try {
    // Get version info
    const { data: version, error: fetchError } = await supabase
      .from('document_versions')
      .select('file_path, is_current')
      .eq('id', versionId)
      .single();

    if (fetchError || !version) {
      throw new Error('Version not found');
    }

    if (version.is_current) {
      throw new Error('Cannot delete current version');
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([version.file_path]);

    if (storageError) {
      console.error('Storage deletion failed:', storageError);
    }

    // Delete version record
    const { error: dbError } = await supabase
      .from('document_versions')
      .delete()
      .eq('id', versionId);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error deleting document version:', error);
    throw error;
  }
};
