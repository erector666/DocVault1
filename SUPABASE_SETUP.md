# 🚀 Supabase Setup & Deployment Guide for DocVault

This guide covers the complete setup and deployment of Supabase for the DocVault project, including database schema, security policies, and edge functions.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally
- A Supabase project (local or remote)

## 🔧 Installation

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Verify Installation

```bash
supabase --version
```

## 🏗️ Project Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   └── 001_initial_schema.sql
├── functions/               # Edge functions
│   ├── convert-document/
│   ├── process-document/
│   └── translate-text/
├── templates/               # Email templates
│   ├── confirm_signup.html
│   ├── confirm_signin.html
│   ├── reset_password.html
│   ├── change_email_address.html
│   ├── confirm_change_email_address.html
│   ├── magic_link.html
│   └── invite.html
└── seed.sql                 # Initial seed data
```

## 🚀 Deployment Options

### Option 1: Local Development Environment

Start a local Supabase instance for development:

```bash
# PowerShell (Windows)
.\scripts\deploy-supabase.ps1 --Local

# Bash (Linux/macOS)
./scripts/deploy-supabase.sh --local
```

This will:
- Start local Supabase services
- Apply database migrations
- Seed initial data
- Provide local URLs for development

**Local URLs:**
- Dashboard: http://localhost:54323
- API: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres

### Option 2: Remote Production Deployment

Deploy to your remote Supabase project:

```bash
# PowerShell (Windows)
.\scripts\deploy-supabase.ps1

# Bash (Linux/macOS)
./scripts/deploy-supabase.sh
```

**Before remote deployment:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Link your local project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Option 3: Dry Run (Validation Only)

Validate your configuration without making changes:

```bash
# PowerShell (Windows)
.\scripts\deploy-supabase.ps1 --DryRun

# Bash (Linux/macOS)
./scripts/deploy-supabase.sh --dry-run
```

## 🗄️ Database Schema

### Core Tables

#### Documents
- **id**: UUID (Primary Key)
- **name**: Document filename
- **type**: MIME type
- **size**: File size in bytes
- **url**: Storage URL
- **user_id**: Owner (Foreign Key to auth.users)
- **category**: Document category
- **tags**: Array of tags
- **keywords**: AI-extracted keywords
- **confidence**: AI confidence score
- **document_type**: AI-classified document type
- **language**: Document language
- **ai_analysis**: JSON metadata from AI processing
- **metadata**: Additional metadata
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

#### Categories
- **id**: UUID (Primary Key)
- **name**: Category name
- **user_id**: Owner (Foreign Key to auth.users)
- **color**: Hex color code
- **icon**: Icon identifier
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

#### Document Versions
- **id**: UUID (Primary Key)
- **document_id**: Parent document (Foreign Key)
- **version_number**: Version number
- **file_path**: Storage path
- **file_size**: File size in bytes
- **checksum**: File checksum
- **created_at**: Creation timestamp
- **created_by**: User who created version

#### Document Shares
- **id**: UUID (Primary Key)
- **document_id**: Shared document (Foreign Key)
- **shared_by**: User sharing (Foreign Key)
- **shared_with**: User receiving (Foreign Key)
- **permission**: Access level (read/write/admin)
- **expires_at**: Expiration timestamp
- **created_at**: Creation timestamp

#### User Preferences
- **id**: UUID (Primary Key)
- **user_id**: User (Foreign Key to auth.users)
- **theme**: UI theme (light/dark/auto)
- **language**: Interface language
- **notifications_enabled**: Notification toggle
- **auto_backup_enabled**: Auto-backup toggle
- **storage_quota**: Storage limit in bytes
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

#### Audit Logs
- **id**: UUID (Primary Key)
- **user_id**: User (Foreign Key to auth.users)
- **action**: Action performed
- **resource_type**: Type of resource affected
- **resource_id**: ID of resource affected
- **details**: JSON details
- **ip_address**: User's IP address
- **user_agent**: User's browser/agent
- **created_at**: Creation timestamp

### Indexes

The schema includes comprehensive indexing for optimal performance:

- **Primary keys**: All tables have UUID primary keys
- **Foreign keys**: Indexed for fast joins
- **Search fields**: Full-text search on document content
- **Array fields**: GIN indexes for tags and keywords
- **JSON fields**: GIN indexes for AI analysis and metadata
- **Timestamp fields**: Indexed for sorting and filtering

## 🔒 Security & RLS Policies

### Row Level Security (RLS)

All tables have RLS enabled with user-specific policies:

- **Documents**: Users can only access their own documents
- **Categories**: Users can only manage their own categories
- **Document Versions**: Access controlled by parent document ownership
- **Document Shares**: Users can see shares they own or are shared with
- **User Preferences**: Users can only access their own preferences
- **Audit Logs**: Users can only see their own audit logs

### Storage Policies

Storage bucket policies ensure:
- Users can only upload to their own folder
- Users can only access their own files
- File size limits enforced (50MB)
- Allowed file types restricted
- Secure folder structure: `documents/{user_id}/{filename}`

## 📧 Email Templates

Custom email templates for authentication flows:

- **Signup Confirmation**: Welcome new users
- **Signin Confirmation**: Verify signin attempts
- **Password Reset**: Secure password recovery
- **Email Change**: Verify email address changes
- **Magic Link**: Passwordless authentication
- **Invitations**: User invitations

## 🔧 Edge Functions

### Available Functions

1. **convert-document**: Convert documents between formats
2. **process-document**: AI-powered document processing
3. **translate-text**: Multi-language text translation

### Function Configuration

Functions are configured with:
- TypeScript support
- Environment variable management
- CORS configuration
- Error handling
- Logging and monitoring

## 🚀 Deployment Commands

### Manual Deployment

```bash
# Database migrations
supabase db push

# Edge functions
supabase functions deploy

# Storage policies
supabase storage deploy

# Seed data (local only)
supabase db seed
```

### Local Development

```bash
# Start local services
supabase start

# Stop local services
supabase stop

# Reset database
supabase db reset

# View logs
supabase logs
```

## 🔍 Verification

### Health Check

After deployment, verify:

1. **API Endpoints**: Test REST API responses
2. **Database**: Verify table creation and policies
3. **Storage**: Test file upload/download
4. **Authentication**: Test signup/signin flows
5. **Edge Functions**: Test function execution

### Testing URLs

- **API Health**: `{SUPABASE_URL}/rest/v1/`
- **Auth Health**: `{SUPABASE_URL}/auth/v1/`
- **Storage Health**: `{SUPABASE_URL}/storage/v1/`

## 🛠️ Troubleshooting

### Common Issues

1. **CLI Not Found**: Install with `npm install -g supabase`
2. **Project Not Linked**: Run `supabase link --project-ref YOUR_REF`
3. **Migration Failures**: Check SQL syntax and dependencies
4. **Function Deployment**: Verify TypeScript compilation
5. **Storage Policies**: Check bucket configuration

### Debug Commands

```bash
# Validate configuration
supabase config validate

# Check project status
supabase status

# View project info
supabase projects list

# Check database schema
supabase db diff
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Next Steps

After successful deployment:

1. **Configure Environment Variables**: Set up your app's environment
2. **Test Authentication**: Verify signup/signin flows
3. **Test File Operations**: Upload, download, and manage documents
4. **Monitor Performance**: Use Supabase dashboard for insights
5. **Set Up Monitoring**: Configure alerts and logging

---

**Need Help?** Check the troubleshooting section or refer to the Supabase documentation for detailed guidance.
