# 🚀 CI/CD Pipeline Setup Guide
## GitHub → Firebase → Vercel

This guide will walk you through setting up the complete CI/CD pipeline for your DocVault application.

---

## 📋 PREREQUISITES

- ✅ GitHub repository: `https://github.com/erector666/DocVault1.git`
- ✅ Firebase project: `gpt1-77ce0`
- ✅ Vercel account (free tier available)
- ✅ Google Cloud Translation API enabled

---

## 🔑 STEP 1: GitHub Repository Secrets

### Navigate to your GitHub repository:
1. Go to: `https://github.com/erector666/DocVault1.git`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Add these secrets:

#### Firebase Secrets:
```
Name: FIREBASE_TOKEN
Value: [Get from Firebase CLI: firebase login:ci]
```

```
Name: GOOGLE_TRANSLATE_API_KEY
Value: AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY
```

```
Name: GOOGLE_LANGUAGE_API_KEY
Value: AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY
```

#### Vercel Secrets:
```
Name: VERCEL_TOKEN
Value: [Get from Vercel Dashboard → Settings → Tokens]
```

```
Name: VERCEL_ORG_ID
Value: [Get from Vercel Dashboard → Settings → General]
```

```
Name: VERCEL_PROJECT_ID
Value: [Get after creating Vercel project]
```

---

## 🔥 STEP 2: Firebase CLI Token

### Get Firebase deployment token:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Generate CI token
firebase login:ci

# Copy the token and add it to GitHub secrets as FIREBASE_TOKEN
```

---

## 🌐 STEP 3: Vercel Project Setup

### 3.1 Create Vercel Project:
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository: `erector666/DocVault1`
4. Set project name: `docvault-app`
5. Click **Deploy**

### 3.2 Get Vercel Credentials:
1. **VERCEL_TOKEN**: 
   - Go to Vercel Dashboard → Settings → Tokens
   - Click **Create Token**
   - Copy the token

2. **VERCEL_ORG_ID**:
   - Go to Vercel Dashboard → Settings → General
   - Copy the **Team ID**

3. **VERCEL_PROJECT_ID**:
   - Go to your project dashboard
   - Copy the **Project ID** from the URL or settings

### 3.3 Add Environment Variables to Vercel:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable from `vercel-env-production.txt`:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyAXBPuFnMNl6UDUrz75h-KFk92pMTtEuis
REACT_APP_FIREBASE_AUTH_DOMAIN=gpt1-77ce0.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=gpt1-77ce0
REACT_APP_FIREBASE_STORAGE_BUCKET=gpt1-77ce0.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=887480132482
REACT_APP_FIREBASE_APP_ID=1:887480132482:web:7f8d166d0d36d4f058e59b
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XTCDJJGTD2
REACT_APP_FUNCTIONS_BASE_URL=https://us-central1-gpt1-77ce0.cloudfunctions.net
NODE_ENV=production
REACT_APP_ENV=production
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_LOGGING=true
```

**Important**: Set Environment to **Production** for all variables!

---

## 🚀 STEP 4: Test the Pipeline

### 4.1 Push to GitHub:
```bash
git add .
git commit -m "Setup CI/CD pipeline with GitHub Actions"
git push origin main
```

### 4.2 Monitor GitHub Actions:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run:
   - ✅ Build and Test
   - ✅ Deploy Firebase Functions
   - ✅ Deploy to Vercel
   - ✅ Update Status

---

## 🔍 STEP 5: Verify Deployment

### 5.1 Check Firebase Functions:
```bash
# Test your deployed functions
curl -X POST "https://us-central1-gpt1-77ce0.cloudfunctions.net/getSupportedLanguages"
```

### 5.2 Check Vercel Deployment:
- Visit your Vercel deployment URL
- Test the translation features
- Verify Firebase authentication works

---

## 📊 PIPELINE FLOW

```
GitHub Push → GitHub Actions → Build & Test → Deploy Firebase → Deploy Vercel → Live App
     ↓              ↓              ↓              ↓              ↓           ↓
  Code Push    CI/CD Pipeline   Quality Check   Backend API   Frontend    Production
```

---

## 🚨 TROUBLESHOOTING

### Common Issues:

#### 1. Firebase Deployment Fails:
- Check `FIREBASE_TOKEN` secret is correct
- Verify Firebase CLI is installed: `firebase --version`
- Check function dependencies: `cd functions && npm install`

#### 2. Vercel Deployment Fails:
- Verify all environment variables are set
- Check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Ensure environment variables are set to **Production**

#### 3. Build Fails:
- Check Node.js version (requires 18+)
- Verify all dependencies are installed: `npm ci`
- Check for TypeScript errors: `npm run type-check`

---

## 🎯 NEXT STEPS

After successful setup:

1. **Test the complete pipeline** with a small code change
2. **Monitor deployments** in GitHub Actions
3. **Set up branch protection** rules for `main` branch
4. **Configure automatic testing** on pull requests
5. **Set up monitoring** and alerts

---

## 📞 SUPPORT

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Ensure environment variables match your configuration
4. Test each service individually before running the full pipeline

---

**🎉 Congratulations! Your CI/CD pipeline is now ready to automatically deploy your DocVault application!**
