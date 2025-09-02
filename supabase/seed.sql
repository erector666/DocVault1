-- Seed data for DocVault
-- This file contains initial data that should be loaded after the schema is created

-- Insert default categories for new users
INSERT INTO categories (id, name, user_id, color, icon) VALUES
  (gen_random_uuid(), 'Documents', '00000000-0000-0000-0000-000000000000', '#3B82F6', 'document'),
  (gen_random_uuid(), 'Images', '00000000-0000-0000-0000-000000000000', '#10B981', 'image'),
  (gen_random_uuid(), 'PDFs', '00000000-0000-0000-0000-000000000000', '#EF4444', 'file-pdf'),
  (gen_random_uuid(), 'Contracts', '00000000-0000-0000-0000-000000000000', '#F59E0B', 'file-contract'),
  (gen_random_uuid(), 'Invoices', '00000000-0000-0000-0000-000000000000', '#8B5CF6', 'file-invoice'),
  (gen_random_uuid(), 'Receipts', '00000000-0000-0000-0000-000000000000', '#06B6D4', 'receipt'),
  (gen_random_uuid(), 'Personal', '00000000-0000-0000-0000-000000000000', '#EC4899', 'user'),
  (gen_random_uuid(), 'Work', '00000000-0000-0000-0000-000000000000', '#6366F1', 'briefcase'),
  (gen_random_uuid(), 'Archive', '00000000-0000-0000-0000-000000000000', '#6B7280', 'archive')
ON CONFLICT DO NOTHING;

-- Insert default user preferences template
INSERT INTO user_preferences (id, user_id, theme, language, notifications_enabled, auto_backup_enabled, storage_quota) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'auto', 'en', true, true, 1073741824)
ON CONFLICT DO NOTHING;
