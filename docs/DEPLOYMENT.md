# DocVault Deployment Guide

## Overview

DocVault is a modern document management system built with React, TypeScript, and Supabase. This guide covers deployment to various platforms including Netlify, Vercel, and self-hosted environments.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account and project
- Git repository

## Environment Variables

Create the following environment variables in your deployment platform:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional: Google Translate API (for translation features)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key

# Optional: Analytics
REACT_APP_ANALYTICS_ID=your-analytics-id
```

## Supabase Setup

### 1. Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT,
  url TEXT NOT NULL,
  ai_classification JSONB,
  extracted_text TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `documents`
3. Set the bucket to public if you want direct file access
4. Configure storage policies:

```sql
-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Edge Functions (Optional)

Deploy the following Edge Functions for enhanced functionality:

```bash
# Deploy translation function
supabase functions deploy translate-text

# Deploy document processing function
supabase functions deploy process-document

# Deploy document conversion function
supabase functions deploy convert-document
```

## Netlify Deployment

### Automatic Deployment

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18`

3. Add environment variables in Netlify dashboard
4. Deploy automatically on git push

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

### Netlify Configuration

The `netlify.toml` file is already configured with:
- Build settings
- Redirects for SPA routing
- Security headers
- Caching policies

## Vercel Deployment

### Automatic Deployment

1. Import your repository in Vercel dashboard
2. Configure build settings:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

3. Add environment variables
4. Deploy automatically on git push

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
vercel --prod
```

## Self-Hosted Deployment

### Using Docker

1. Create a Dockerfile:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create nginx.conf:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Cache static assets
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

3. Build and run:

```bash
# Build Docker image
docker build -t docvault .

# Run container
docker run -p 80:80 docvault
```

### Using PM2 (Node.js)

```bash
# Install PM2
npm install -g pm2

# Install serve
npm install -g serve

# Build the project
npm run build

# Start with PM2
pm2 start "serve -s build -l 3000" --name docvault

# Save PM2 configuration
pm2 save
pm2 startup
```

## Performance Optimization

### Build Optimization

1. Enable production build optimizations:

```bash
# Build with optimizations
GENERATE_SOURCEMAP=false npm run build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

2. Configure compression in your web server:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### CDN Configuration

Configure your CDN to cache static assets:

```
# Cache static assets for 1 year
/static/* -> Cache-Control: public, max-age=31536000, immutable

# Cache index.html for 5 minutes
/index.html -> Cache-Control: public, max-age=300

# Cache service worker with no cache
/sw.js -> Cache-Control: no-cache
```

## Monitoring and Logging

### Error Tracking

Integrate with error tracking services:

```javascript
// In src/index.tsx
import * as Sentry from "@sentry/react";

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
```

### Analytics

Add analytics tracking:

```javascript
// In src/services/analytics.ts
import { analytics } from './analytics';

// Track page views
analytics.trackPageView(window.location.pathname);

// Track user actions
analytics.track('document_upload', { fileName, size });
```

### Health Checks

Create health check endpoints for monitoring:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

## Security Considerations

### Content Security Policy

Configure CSP headers:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-supabase-url; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://your-supabase-url wss://your-supabase-url;
```

### HTTPS Configuration

Always use HTTPS in production:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check for TypeScript errors: `npm run type-check`

2. **Supabase Connection Issues**
   - Verify environment variables are set correctly
   - Check Supabase project URL and API keys
   - Ensure RLS policies are configured properly

3. **File Upload Issues**
   - Check storage bucket permissions
   - Verify file size limits
   - Ensure CORS is configured for your domain

4. **Authentication Issues**
   - Check Supabase auth configuration
   - Verify redirect URLs are whitelisted
   - Ensure JWT secret is configured

### Debugging

Enable debug mode for troubleshooting:

```bash
# Enable debug logging
REACT_APP_DEBUG=true npm start

# Check network requests in browser dev tools
# Monitor Supabase logs in dashboard
# Check server logs for errors
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor Performance**
   - Check Core Web Vitals
   - Monitor error rates
   - Review user feedback

3. **Backup Data**
   - Regular Supabase backups
   - Export user data periodically
   - Test restore procedures

4. **Security Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Review access logs

### Scaling Considerations

- Monitor Supabase usage limits
- Consider CDN for global distribution
- Implement caching strategies
- Optimize database queries
- Consider horizontal scaling for high traffic

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check platform-specific deployment guides
4. Contact support if needed

---

Last updated: January 2024
