# 🚀 CI/CD Setup Guide - GitHub → Supabase → Vercel

Complete CI/CD pipeline that automatically deploys your React app from GitHub to Supabase (backend) and Vercel (frontend).

## 🔄 Pipeline Overview

**GitHub Push → Code Quality → Supabase Backend → Vercel Frontend → Verification**

The pipeline ensures:
- ✅ Code quality checks (ESLint, TypeScript, Tests)
- ✅ Automatic builds and testing
- ✅ Supabase backend deployment (Database, Functions, Storage)
- ✅ Vercel frontend deployment
- ✅ Health checks and verification

## 🏗️ Architecture

```
GitHub Repository
       ↓
GitHub Actions
       ↓
┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │     Vercel      │
│   Backend       │    │   Frontend      │
│                 │    │                 │
│ • Database      │    │ • React App     │
│ • Edge Functions│    │ • Static Assets │
│ • Storage       │    │ • API Routes    │
│ • Auth          │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🔑 Required Secrets

### GitHub Repository Secrets

Add these to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Supabase Secrets:
```
Name: SUPABASE_ACCESS_TOKEN
Value: [Get from Supabase CLI: supabase tokens new]

Name: SUPABASE_PROJECT_REF
Value: [Your Supabase project reference ID]
```

#### Vercel Secrets:
```
Name: VERCEL_TOKEN
Value: [Get from Vercel CLI: vercel token]

Name: VERCEL_ORG_ID
Value: [Your Vercel organization ID]

Name: VERCEL_PROJECT_ID
Value: [Your Vercel project ID]
```

#### Environment Variables:
```
Name: REACT_APP_SUPABASE_URL
Value: [Your Supabase project URL]

Name: REACT_APP_SUPABASE_ANON_KEY
Value: [Your Supabase anonymous key]
```

## 🚀 STEP 1: Supabase CLI Token

### Get Supabase deployment token:

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Generate new token
supabase tokens new

# Copy the token and add it to GitHub secrets as SUPABASE_ACCESS_TOKEN
```

## 🚀 STEP 2: Vercel CLI Token

### Get Vercel deployment token:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Generate token
vercel token

# Copy the token and add it to GitHub secrets as VERCEL_TOKEN
```

## 🚀 STEP 3: Project IDs

### Get Vercel Project Details:

```bash
# List projects
vercel projects

# Get project details
vercel project ls

# Copy the org ID and project ID to GitHub secrets
```

### Get Supabase Project Reference:

```bash
# List projects
supabase projects list

# Copy the project reference ID to GitHub secrets
```

## 🚀 STEP 4: Environment Configuration

### Supabase Environment Variables:

```bash
# Get from your Supabase project dashboard
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Environment Variables:

```bash
# Add these to Vercel project settings
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔄 Pipeline Workflow

### 1. Code Quality Check
- ESLint validation
- TypeScript compilation check
- Unit tests execution
- Build verification

### 2. Supabase Backend Deployment
- Database migrations
- Edge functions deployment
- Storage policies update
- RLS policies verification

### 3. Vercel Frontend Deployment
- Production build
- Asset optimization
- CDN deployment
- Domain verification

### 4. Health Check
- API endpoint verification
- Database connectivity test
- Function execution test
- Frontend accessibility check

## 🚀 Deployment Commands

### Manual Deployment (if needed):

```bash
# Deploy Supabase backend
supabase db push
supabase functions deploy
supabase storage deploy

# Deploy Vercel frontend
vercel --prod
```

### Local Testing:

```bash
# Test Supabase locally
supabase start
supabase db reset
supabase functions serve

# Test Vercel locally
vercel dev
```

## 🔍 Verification Steps

### 1. Check Supabase Functions:
```bash
# List deployed functions
supabase functions list

# Test function execution
curl -X POST https://your-project.supabase.co/functions/v1/process-document \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. Verify Database Schema:
```bash
# Check table structure
supabase db diff

# Verify RLS policies
supabase db reset --linked
```

### 3. Test Frontend:
- Verify Vercel deployment
- Check environment variables
- Test authentication flows
- Verify document operations

## 🚨 Troubleshooting

### Common Issues:

#### 1. Supabase Deployment Fails:
- Check `SUPABASE_ACCESS_TOKEN` secret is correct
- Verify Supabase CLI is installed: `supabase --version`
- Check project reference ID is valid

#### 2. Vercel Deployment Fails:
- Verify `VERCEL_TOKEN` secret is correct
- Check organization and project IDs
- Ensure Vercel CLI is properly configured

#### 3. Environment Variables Missing:
- Verify all required variables are set in Vercel
- Check GitHub secrets are properly configured
- Ensure variable names match exactly

#### 4. Database Connection Issues:
- Verify Supabase project is active
- Check database credentials
- Ensure RLS policies are properly configured

### Debug Commands:

```bash
# Check Supabase status
supabase status

# Verify Vercel configuration
vercel whoami
vercel project ls

# Test database connection
supabase db ping

# Check function logs
supabase functions logs
```

## 📊 Monitoring & Alerts

### GitHub Actions:
- Build status notifications
- Deployment success/failure alerts
- Test coverage reports

### Supabase Dashboard:
- Function execution metrics
- Database performance
- Storage usage statistics

### Vercel Analytics:
- Frontend performance
- User experience metrics
- Error tracking

## 🔄 Complete Flow

**GitHub Push → GitHub Actions → Build & Test → Deploy Supabase → Deploy Vercel → Live App**

## 📚 Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

**Need Help?** Check the troubleshooting section or refer to the official documentation for detailed guidance.
