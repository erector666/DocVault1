import { supabase, Document } from './supabase';

export const uploadDocument = async (
  file: File,
  userId: string,
  category?: string,
  tags?: string[]
): Promise<Document> => {
  // Upload file to storage
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  // Insert document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      user_id: userId,
      category,
      tags,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }

  return data;
};

export const getDocuments = async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data || [];
};

export const getDocument = async (id: string): Promise<Document | null> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Document not found
    }
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  // Get document to find file path
  const document = await getDocument(id);
  if (!document) {
    throw new Error('Document not found');
  }

  // Delete from storage
  const fileName = document.url.split('/').pop();
  if (fileName) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([`${document.user_id}/${fileName}`]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

export const updateDocument = async (
  id: string,
  updates: Partial<Document>
): Promise<Document> => {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data;
};
